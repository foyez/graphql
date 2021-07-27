const { ApolloServer, gql, PubSub } = require('apollo-server')

const pubsub = new PubSub()
const NEW_ITEM = 'NEW_ITEM'

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

  type Item {
    task: String!
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
    createItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item
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
    createItem(_root, { task }) {
      const item = { task }
      pubsub.publish(NEW_ITEM, { newItem: item })

      return item
    },
  },

  Subscription: {
    newItem: {
      subscribe: () => pubsub.asyncIterator(NEW_ITEM),
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
  context({ connection }) {
    if (connection) {
      return { ...connection.context }
    }

    return {}
  },
  subscriptions: {
    onConnect(connectionParams) {
      // handle auth here
    },
  },
})

server.listen().then(({ url }) => console.log(`server at ${url}`))
