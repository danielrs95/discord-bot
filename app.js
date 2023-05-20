require("dotenv").config();
const express = require("express");
const {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} = require("discord-interactions");
const {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} = require("./utils.js");
const Discord = require("discord.js");

const { Client, Collection, Events, GatewayIntentBits } = Discord;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Assumamos que tienes una lista de emojis
const emojiList = ["emoji1", "emoji2", "emoji3", "..."];

// Entonces puedes crear las opciones para el menú de selección
const emojiOptions = emojiList.map((emoji, index) => {
  return {
    label: emoji,
    value: emoji,
    description: `Filtrar por ${emoji}`,
  };
});

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
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: "hello world " + getRandomEmoji(),
        },
      });
    }

    // "filter" command
    if (name === "filter" && id) {
      const userId = req.body.member.user.id;
      const guildId = req.body.guild_id;

      const guild = client.guilds.cache.get(guildId);

      const channelPromises = guild.channels.cache.map(async (channel) => {
        if (channel.type === 0) {
          const messages = await channel.messages.fetch({ limit: 100 });

          const reactionPromises = messages.map(async (message) => {
            // Itera sobre los values del objeto reactions
            for (const reaction of message.reactions.cache.values()) {
              if (reaction.emoji.name === "pepenoted") {
                const usersWhoReacted = await reaction.users.fetch();

                // Si tiene el emoji, agregar al array
                if (usersWhoReacted.has(userId)) {
                  let url = `https://discord.com/channels/${guildId}/${message.channelId}/${message.id}`;

                  response.push({
                    // Elimina \n y limita longitud a 100 caracteres
                    content:
                      message.content.replace(/\n/g, " ").substring(0, 97) +
                      "...",
                    url,
                  });
                }
              }
            }
          });

          // Resolver todas las promesas
          await Promise.all(reactionPromises);
        }
      });

      // Resolver todas las promesas
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
          content: `Filtrando mensajes con :pepenoted: de <@${userId}>`,
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

      // Send results
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `${selectedOption}` },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
