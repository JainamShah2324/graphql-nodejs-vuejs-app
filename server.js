const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

app.use(express.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type rootQuery {
            events: [String!]!
        }

        type rootMutation {
            createEvent(name: String) : String
        }

        schema {
            query: rootQuery
            mutation: rootMutation
        }
    `),
    rootValue: {
        events: () => {
            return ["programming", "gaming", "cooking", "problem solving"];
        },

        createEvent: (args) => {
            const eventName = args.name;
            return eventName;
        }
    },
    graphiql: true
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});