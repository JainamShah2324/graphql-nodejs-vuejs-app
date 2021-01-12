const Event = require('../../models/event');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');

const getEventsByIds = async function (eventIds) {
    try {
        const events = await Event.find({ _id: { $in: eventIds } });
        return events.map(event => {
            return {
                ...event._doc,
                created_by: getUserById.bind(this, event._doc.created_by)
            };
        })
    } catch (err) {
        console.log(err)
        throw err;
    }
}

const getUserById = async function (userId) {
    try {
        const user = await User.findById(userId);
        return {
            ...user._doc,
            password: null,
            createdEvents: getEventsByIds.bind(this, user.createdEvents)
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    events: async () => {
        try {
            const events = await Event.find()
            return events.map(event => {
                return {
                    ...event._doc,
                    date: new Date(event._doc.date).toISOString(),
                    created_by: getUserById.bind(this, event._doc.created_by)
                };
            });
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    createEvent: async (args) => {
        try {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: parseFloat(args.eventInput.price),
                date: new Date(args.eventInput.date),
                created_by: "5ffd457bac3a650b5cb9f322"
            });
            const eventData = await event.save();
            const user = await User.findById(event.created_by);
            user.createdEvents.push(eventData.id);
            await user.save();
            return {
                ...eventData._doc,
                created_by: getUserById.bind(this, eventData._doc.created_by)
            }
        } catch (err) {
            console.log(err);
            throw (err);
        }
    },

    createUser: async (args) => {
        try {
            const user = await User.findOne({ email: args.userInput.email });
            if (user) {
                throw new Error("User already exists");
            } else {
                const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword,
                });
                const userData = await user.save()
                userData.password = null;
                return userData;
            }
        } catch (err) {
            console.log(err);
            throw (err);
        }
    }
}