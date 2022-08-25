const { Client, GatewayIntentBits, SlashCommandBuilder, ModalBuilder, SelectMenuBuilder, TextInputBuilder, ActionRowBuilder, SelectMenuOptionBuilder, EmbedBuilder } = require('discord.js')
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
})
const path = require('path')
const { REST } = require("@discordjs/rest");
const { Routes, TextInputStyle, ComponentType, InteractionType } = require("discord-api-types/v10")
require('dotenv').config()

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN)

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setUsername("NuclearRestorer")
    client.user.setActivity("nukes get destroyed", { type: "WATCHING" })
})

async function main() {
    const commands = [new SlashCommandBuilder()
        .setDescription("Give feedback to us! This can be a bug report, a feature request, or anything you'd like to tell us.")
        .setName("feedback")
        .toJSON(),
    new SlashCommandBuilder()
        .setName("delete_messages")
        .setDescription("Delete messages that contain a keyphrase.")
        .addStringOption(option =>
            option
                .setName("keyphrase")
                .setDescription("The keyphrase contained in the messages you wish to delete")
                .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName("delete_channels")
        .setDescription("Delete channels that contain a keyphrase.")
        .addStringOption(option =>
            option
                .setName("keyphrase")
                .setDescription("The keyphrase contained in the channels you wish to delete")
                .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName("bomb")
        .setDescription("Deletes all channels except for channels containing a keyphrase. EXTREMELY DESTRUCTIVE.")
        .addStringOption(option =>
            option
                .setName("keyphrase")
                .setDescription("The keyphrase of the channels you wish to exlude from deletion")
                .setRequired(true)
        )
        .toJSON()
    ]
    try {
        await rest.put(Routes.applicationCommands("989853936246738984"), {
            body: commands
        })
    } catch (e) { console.error(e) }
}
main()

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) return;
    if (interaction.commandName === "feedback") {
        // Create Select Menu for type
        const feedbackType = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setPlaceholder("Select a feedback type")
                    .setCustomId("feedbackType")
                    .setOptions([
                        new SelectMenuOptionBuilder()
                            .setLabel("Bug")
                            .setValue("bug")
                            .setDescription("Report a bug or glitch.")
                            .setEmoji("<:bug_hunter:1011207716284399686>"),
                        new SelectMenuOptionBuilder()
                            .setLabel("Feature")
                            .setValue("feature")
                            .setDescription("Request a new feature.")
                            .setEmoji("<:discord_hammer:1011208726583201792>"),
                        new SelectMenuOptionBuilder()
                            .setLabel("Other")
                            .setValue("other")
                            .setDescription("Tell us anything else.")
                            .setEmoji("<:thinkingemoji:1011212163127451708>")
                    ])
            )
        const thanksEmbed =
            new EmbedBuilder()
                .setTitle("Feedback")
                .setColor("Blurple")
                .setFields([
                    {
                        name: "Choose your feedback type",
                        value: "Thanks for taking your time to send feedback! Please select your feedback type on the select menu below, a form will pop up to further expand your message."
                    }
                ])
                .setTimestamp()
        await interaction.reply({ embeds: [thanksEmbed], components: [feedbackType], ephemeral: true })

        const replyMsg = await interaction.fetchReply()

        const feedbackCollector = replyMsg.createMessageComponentCollector({
            componentType: ComponentType.SelectMenu,
            time: 15000,
            filter: i => i.user.id === interaction.user.id
        })

        feedbackCollector.on("collect", async i => {
            // Show feedback modal
            const feedbackModal = new ModalBuilder()
                .setTitle("Feedback | " + i.values[0])
                .setCustomId("feedbackModal")

            const feedbackMessage = new TextInputBuilder()
                .setPlaceholder("Enter your feedback here")
                .setCustomId("feedbackMessage")
                .setLabel("Feedback Message")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(250)
                .setStyle(TextInputStyle.Paragraph)

            feedbackModal.addComponents(new ActionRowBuilder().addComponents(feedbackMessage))

            await i.showModal(feedbackModal)
            thanksEmbed.setColor("Greyple")
            await interaction.editReply({ components: [], embeds: [thanksEmbed] })
            client.on("interactionCreate", async interaction => {
                if (interaction.type !== InteractionType.ModalSubmit) return;
                if (interaction.customId === "feedbackModal") {
                    const submitEmbed =
                        new EmbedBuilder()
                            .setTitle("Feedback")
                            .setColor("Green")
                            .setFields([
                                {
                                    name: "Thanks",
                                    value: "Thanks for submitting feedback, this will be sent to the bot developer and reviewed as soon as possible."
                                },
                                {
                                    name: "Type",
                                    value: i.values[0]
                                },
                                {
                                    name: "Your message",
                                    value: interaction.fields.components[0].components[0].value
                                }
                            ])
                            .setTimestamp()
                    await interaction.reply({ embeds: [submitEmbed], ephemeral: true })
                    const dev = client.users.cache.find(user => user.id === "695228246966534255")
                    const devembed = new EmbedBuilder()
                        .setTitle("New feedback")
                        .setColor("Orange")
                        .setFields([{
                            name: "Type",
                            value: i.values[0]
                        },
                        {
                            name: "Message",
                            value: interaction.fields.components[0].components[0].value
                        }
                        ])
                        .setTimestamp()
                        .setFooter({
                            text: interaction.user.tag + " | " + interaction.user.id,
                            iconURL: interaction.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
                        })
                    await dev.send({ embeds: [devembed] })
                }
            })
        })
        feedbackCollector.on("end", async collected => {
            if (collected.size == 0) {
                const endEmbed =
                    new EmbedBuilder()
                        .setTitle("Feedback")
                        .setColor("Red")
                        .setFields([
                            {
                                name: "You didn't respond",
                                value: "You didn't respond in time so we cancelled your feedback request, you can request to send feedback again by using /feedback!"
                            }
                        ])
                        .setTimestamp()
                await interaction.editReply({ components: [], embeds: [endEmbed] })
            } else {
                thanksEmbed.setColor("Greyple")
                await interaction.editReply({ components: [], embeds: [thanksEmbed] })
            }
        })
    } else if (interaction.commandName === "delete_messages") {
        const channels = interaction.guild.channels.cache;
        await interaction.reply({
            content: "<a:loading:990299764702736465> Searching for messages...",
            ephemeral: true,
        });
        var msgfound;
        channels.each(async (channel) => {
            var chnlMessages = await channel.messages
            if (chnlMessages) {
                var messages = await chnlMessages.fetch()
                const result = await messages.filter(checkName);
                var x = 0;
                result.each(async (msg) => {
                    if (x == result.size - 1) {
                        try {
                            setTimeout(async () => {
                                await interaction.editReply({
                                    content: "<:tickthatmatcheswithlink:942981588470358046> Deleted messages!",
                                    ephemeral: true,
                                });
                            }, 1000);
                        } catch (e) { }
                    }
                    x++;
                    try {
                        msgfound = true;
                        msg.delete();
                    } catch (e) {
                        console.error(e)
                    }
                });
                setTimeout(async () => {
                    if (!msgfound) {
                        try {
                            await interaction.editReply({
                                content: "<:NOOOO:972407934946512936> No messages found with that keyword!",
                                ephemeral: true,
                            });
                        } catch (e) { }
                    }
                }, 5000)
            } else return
        });
        function checkName(msg) {
            return msg.content.includes(interaction.options._hoistedOptions[0].value);
        }
    } else if (interaction.commandName === "delete_channels") {
        const channels = interaction.guild.channels.cache;
        const result = await channels.filter(checkName);
        await interaction.reply({
            content: "<a:loading:990299764702736465> Searching for channels...",
            ephemeral: true,
        });

        var x = 0;
        if (result.size == 0) {
            try {
                await interaction.editReply({
                    content: "<:NOOOO:972407934946512936> No channels found with that name!",
                    ephemeral: true,
                });
            } catch (e) { }
        }
        result.each(async (channel) => {
            if (x == result.size - 1) {
                try {
                    setTimeout(async () => {
                        await interaction.editReply({
                            content: "<:tickthatmatcheswithlink:942981588470358046> Deleted channels!",
                            ephemeral: true,
                        });
                    }, 1000);
                } catch (e) { }
            }
            x++;
            try {
                channel.delete();
            } catch (e) { }
        });

        function checkName(channel) {
            return channel.name == interaction.options._hoistedOptions[0].value;
        }
    } else if (interaction.commandName === "bomb") {
        if (!interaction.options._hoistedOptions[0].value) {
            interaction.options._hoistedOptions[0].value = "";
        }
        const channels = interaction.guild.channels.cache;
        const result = await channels.filter(checkName);
        await interaction.reply({
            content: "<a:loading:990299764702736465> Searching for channels...",
            ephemeral: true,
        });

        var x = 0;
        if (result.size == 0) {
            try {
                await interaction.editReply({
                    content: "<:NOOOO:972407934946512936> No channels found without that keyword!",
                    ephemeral: true,
                });
            } catch (e) { }
        }
        result.each(async (channel) => {
            if (x == result.size - 1) {
                try {
                    setTimeout(async () => {
                        try {
                            await interaction.editReply({
                                content: "<:tickthatmatcheswithlink:942981588470358046> Deleted channels!",
                                ephemeral: true,
                            });
                        } catch (e) { }
                    }, 1000);
                } catch (e) { }
            }
            x++;
            try {
                channel.delete();
            } catch (e) { }
        });

        function checkName(channel) {
            return !(channel.name.includes(interaction.options._hoistedOptions[0].value));
        }
    }
})


client.on("channelCreate", async channel => {
    if (!channel.guild) return;
    var prevChannels = channel.guild.channels.cache.filter(c => c.name == channel.name)
    if (prevChannels.size > 2) {
        var channelAction = "has been deleted"
        try {
            channel.delete("Suspected nuke channel")
        } catch (e) {
            channelAction = "could not be deleted"
        }
        const auditFetch = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 })
        const auditEntry = auditFetch.entries.first()
        var userAction = "has been kicked"
        if (!auditEntry) {
            userAction = "could not be kicked"
        } else {
            var nukeUser = channel.guild.members.cache.find(u => u.id === auditEntry.executor.id)
            try {
                nukeUser.kick("Suspected nuker")
            } catch (e) {
                userAction = "could not be kicked"
            }
        }
        var nukeEmbed = new EmbedBuilder()
            .setTitle("Nuke alert")
            .setColor("Red")
            .setDescription(`A suspected nuke channel was made! It has been detected as a nuke channel because it had the same name as 2 other channels. The channel ${channelAction} and the suspected nuker ${userAction}. Further action should be taken by a server administrator. Remember to report the raid/nuke!`)
            .setFields(
                [
                    {
                        name: "Channel name",
                        value: channel.name
                    },
                    {
                        name: "Suspected channel creator",
                        value: auditEntry.executor.tag || "Unknown"
                    },
                    {
                        name: "Automated action",
                        value: `The channel ${channelAction} and the suspected nuker ${userAction}.`
                    }
                ]
            )
            .setImage("https://i.ibb.co/z2mHw56/report-raid.png")
            .setTimestamp()
        var gOwner = client.users.cache.find(u => u.id == channel.guild.ownerId)
        if (!gOwner) return;
        gOwner.send({ embeds: [nukeEmbed] })
            .catch(() => {
                var chx = channel.guild.channels.cache.filter(chx => chx.type === "text").find(x => x.position === 0);
                if (!chx) return;
                try {
                    chx.send({ embeds: [nukeEmbed] })
                } catch (e) {
                    console.log(e)
                }
            })
    }
})

client.login(process.env.DISCORD_TOKEN)