const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());

const getEventsByIds = async function (eventIds) {
    return await Event.find({ _id: { $in: eventIds } })
        .then((events) => {
            return events.map(event => {
                return { ...event._doc, created_by: getUserById.bind(this, event._doc.created_by) };
            })
        })
}

const getUserById = function (userId) {
    return User.findById(userId)
        .then((user) => {
            return {
                ...user._doc, password: null, createdEvents: getEventsByIds.bind(this, user.createdEvents)
            }
        })
        .catch((err) => {
            console.log(err);
        })
}

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            created_by: User!
        }

        type User {
            _id: ID!
            email: String!
            password: String
            createdEvents: [Event!]
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type rootQuery {
            events: [Event!]!
        }

        type rootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: rootQuery
            mutation: rootMutation
        }
    `),
    rootValue: {
        events: async () => {
            return await Event.find()
            .then((events) => {
                return events.map(event => {
                    return {
                        ...event._doc,
                        created_by: getUserById.bind(this, event._doc.created_by)
                    };
                });
            })
            .catch((err) => {
                console.log(err);
                throw err;
            })
        },

        createEvent: async (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: parseFloat(args.eventInput.price),
                date: new Date(args.eventInput.date).toISOString(),
                created_by: "5ffd457bac3a650b5cb9f322"
            });
            return await event.save()
            .then(async (eventData) => {
                return await User.findById(event.created_by)
                    .then(async (user) => {
                        user.createdEvents.push(eventData.id);
                        return await user.save()
                            .then(() => {
                                return { ...eventData._doc, created_by: getUserById.bind(this, eventData._doc.created_by) }
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                    })
                    .catch((err) => {
                        console.log(err);
                    })
            })
            .catch((err) => {
                console.log(err);
                throw(err);
            })
        },

        createUser: async (args) => {
            await User
                .findOne({ email: args.userInput.email })
                .then(async (user) => {
                    if(user){
                        throw new Error("User already exists");
                    } else {
                        return await bcrypt.hash(args.userInput.password, 12)
                            .then(async (hashedPassword) => {
                                const user = new User({
                                    email: args.userInput.email,
                                    password: hashedPassword,
                                });
                                return await user.save()
                                    .then((userData) => {
                                        userData.password = null;
                                        return userData;
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    })
                            })
                            .catch((err) => {
                                console.log(err)
                            })
                    }
                })
                .catch((err) => {
                    throw err;
                })
        }
    },
    graphiql: true
}));

const PORT = process.env.PORT || 3000;

mongoose
.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@practice.s3cc4.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at port ${PORT}`);
    });
})
.catch((err) => {
    console.log(err);
})