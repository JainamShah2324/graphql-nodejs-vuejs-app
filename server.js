const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const events = [];

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

        createEvent: (args) => {
            const event = {
                _id: Math.random().toString(),
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: parseFloat(args.eventInput.price),
                date: args.eventInput.date
            };
            events.push(event);
            return event;
        }
    },
    graphiql: true
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});