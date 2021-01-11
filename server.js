const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');

const app = express();

app.use(express.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type rootQuery {
            events: [Event!]!
        }

        type rootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: rootQuery
            mutation: rootMutation
        }
    `),
    rootValue: {
        events: () => {
            return events;
        },

        createEvent: async (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: parseFloat(args.eventInput.price),
                date: new Date(args.eventInput.date)
            });
            await event.save()
            .then((event) => {
                return { ...event._doc };
            })
            .catch((err) => {
                console.log(err);
                throw(err);
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