const { ApolloServer, gql } = require('apollo-server')

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    createdAt: Int!
  }

  type Settings {
    user: User!
    theme: String!
  }

  # pass an object as a argument
  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
  }
`

const resolvers = {
  Query: {
    me() {
      return {
        id: 1,
        username: 'foyez',
        createdAt: 3749584958,
      }
    },
    // (root, args, context, info)
    settings(_, { user }) {
      return {
        user,
        theme: 'Light',
      }
    },
  },

  Mutation: {
    settings(_, { input }) {
      return input
    },
  },

  Settings: {
    user() {
      return { id: 1, username: 'foyez', createdAt: 3749584958 }
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => console.log(`server at ${url}`))
