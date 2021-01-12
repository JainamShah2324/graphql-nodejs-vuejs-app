const Event = require('../../models/event');
const User = require('../../models/user');
const Booking = require('../../models/booking');
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

const getEventById = async function (eventId) {
    try {
        const event = await Event.findById(eventId);
        return {
            ...event._doc,
            created_by: getUserById.bind(this, event._doc.created_by)
        };
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

    bookings: async () => {
        try {
            const bookings = await Booking.find();
            return bookings.map(booking => {
                return {
                    ...booking._doc,
                    event: getEventById.bind(this, booking._doc.event),
                    user: getUserById.bind(this, booking._doc.user),
                    createdAt: new Date(booking._doc.createdAt).toISOString(),
                    updatedAt: new Date(booking._doc.updatedAt).toISOString()
                }
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
    },

    bookEvent: async (args) => {
        try {
            const event = await Event.findById(args.eventId);
            const booking = await new Booking({
                user: "5ffd457bac3a650b5cb9f322",
                event: event
            });
            const result = await booking.save();
            return {
                ...result._doc,
                event: getEventById.bind(this, result._doc.event),
                user: getUserById.bind(this, result._doc.user),
                createdAt: new Date(result._doc.createdAt).toISOString(),
                updatedAt: new Date(result._doc.updatedAt).toISOString()
            }
        } catch (err) {
            console.log(err);
            throw (err);
        }
    },

    cancleBooking: async (args) => {
        try {
            const booking = await Booking.findById(args.bookingId).populate('event');
            const event = {
                ...booking.event._doc,
                created_by: getUserById.bind(this, booking.event._doc.created_by)
            };
            await Booking.deleteOne({
                _id: booking.id
            });
            return event;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}