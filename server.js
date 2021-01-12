const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema/index');
const graphqlResolver = require('./graphql/resolvers/index');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
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