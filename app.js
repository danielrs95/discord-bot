require("dotenv").config();
const express = require("express");
const {
  InteractionType,
  InteractionResponseType,
  MessageComponentTypes,
} = require("discord-interactions");

const {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} = require("./utils.js");
const Discord = require("discord.js");

const { Client, GatewayIntentBits } = Discord;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Create an express app
const app = express();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Parse request body and verify incoming requests using the discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;
  const response = [];

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === "test") {
      // Send a message into the channel where the command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: "hello world " + getRandomEmoji(),
        },
      });
    }

    // "filter" command
    if (name === "filtrar" && id) {
      const userId = req.body.member.user.id;
      // Server === guild
      const guildId = req.body.guild_id;
      const guild = client.guilds.cache.get(guildId);

      const channelPromises = guild.channels.cache.map(async (channel) => {
        if (channel.type === 0) {
          const messages = await channel.messages.fetch({ limit: 100 });

          const reactionPromises = messages.map(async (message) => {
            // Iterate over the values of the reactions object
            for (const reaction of message.reactions.cache.values()) {
              if (reaction.emoji.name === "pepenoted") {
                const usersWhoReacted = await reaction.users.fetch();

                // If the user has reacted with the emoji, add it to the array
                if (usersWhoReacted.has(userId)) {
                  let url = `https://discord.com/channels/${guildId}/${message.channelId}/${message.id}`;

                  response.push({
                    // Remove \n (next line) and limit length to 100 characters
                    content:
                      message.content.replace(/\n/g, " ").substring(0, 97) +
                      "...",
                    url,
                  });
                }
              }
            }
          });

          // Resolve all promises
          await Promise.all(reactionPromises);
        }
      });

      // Resolve all promises
      await Promise.all(channelPromises);

      const options = response.map((message, index) => {
        const { url, content } = message;

        return {
          label: `Message #${index + 1}`,
          value: `Mensaje: ${url} `,
          description: content,
        };
      });

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Filtrar mensajes a los que reaccionaste con emoji :pepenoted:`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: "my_select",
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: options,
                },
              ],
            },
          ],
        },
      });
    }
  }

  /**
   * Handle requests from interactive components
   */
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId === "my_select") {
      // Get selected option from payload
      const selectedOption = data.values[0];
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

      // Send results
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `${selectedOption}` },
        });
        // Delete previous message with select options
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
