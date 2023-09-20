const Discord = require('discord.js')
const { REST, Routes } = require('discord.js')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js')
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const client = new Discord.Client({
  intents: 3276799
})


client.on("ready", async (client) => {
  console.log("Ready")
})

const commands = [
  new SlashCommandBuilder()
    .setName('imageuploadcloudinary')
    .setDescription('Upload images to Cloudinary')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  rest.put(Routes.applicationCommands(process.env.CLIENT_ID), // Reemplaza con tu Client ID
    { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === "imageuploadcloudinary") {
    const confirm = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel Upload')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Upload')
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder()
      .addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `Upload Images?`,
      components: [row],
    });

    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
      const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

      if (confirmation.customId === 'confirm') {
        const channel = client.channels.cache.get(process.env.NUMBER_CLIENT);

        channel.messages.fetch({ limit: 100 }).then(messages => {

          console.log(`Received ${messages.size} messages`);
          messages.forEach(message => {
            if (message.attachments.size > 0) {
              message.attachments.forEach(attachment => {
                const url = attachment.url;
                console.log(`File's URL: ${url}`);

                cloudinary.uploader.upload(url,
                  {
                    public_id: attachment.name.split(".")[0],
                    folder: process.env.FOLDER
                  },
                  function (error, result) { console.log(result); });
              });
            }

          })
        })
        await confirmation.update({ content: `Upload`, components: [] });
      } else if (confirmation.customId === 'cancel') {
        await confirmation.update({ content: 'Action cancelled', components: [] });
      }
    } catch (e) {
      await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }
  }
})

client.on("messageCreate", message => {

  if (message.attachments.size > 0) {
    message.attachments.forEach(attachment => {
      const url = attachment.url;
      console.log(`File's URL: ${url}`);

      cloudinary.uploader.upload(url,
        {
          public_id: attachment.name.split(".")[0],
          folder: process.env.FOLDER
        },
        function (error, result) { console.log(result); });
    });
  }
})

client.login(process.env.TOKEN)