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

// Store for in-progress games. In production, you'd want to use a DB

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;
  console.log(data);

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
    console.log(name);

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
      const response = [];
      const userId = req.body.member.user.id;
      const guildId = req.body.guild_id;

      // User's object choice
      const objectName = req.body.data.options[0].value; // Fetch user's messages
      const guild = client.guilds.cache.get(guildId);

      // Iterate over all channels in the server
      guild.channels.cache.forEach(async (channel) => {
        // Fetch messages sent by the user in the channel
        if (channel.type === 0) {
          // Verificar si es un canal de texto
          const user = await client.users.fetch(userId);
          const messages = await channel.messages.fetch({ limit: 100 });
          const userMessages = messages.filter(
            (message) => message.author.id === user.id
          );

          // Do something with the user messages in this channel
          userMessages.forEach((message) => {
            for (const reaction of message.reactions.cache.values()) {
              if (reaction.emoji.name === "pepehardlaugh") {
                console.log(message.content, reaction.emoji.name);
                response.push(message.content);
                console.log({ response });
              }
            }
          });
        }
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `Filtrando mensajes con :pepehardlaugh: <@${userId}>`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: "Accept",
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
