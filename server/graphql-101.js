const { ApolloServer, UserInputError, gql, PubSub, AuthenticationError } = require('apollo-server')
const { v1: uuid } = require('uuid')
const pubsub = new PubSub()

let persons = [
  {
    name: 'Arto Hellas',
    phone: '040-123543',
    street: 'Tapiolankatu 5 A',
    city: 'Espoo',
    id: '3d594650-3436-11e9-bc57-8b80ba54c431',
  },
  {
    name: 'Matti Luukkainen',
    phone: '040-432342',
    street: 'Malminkaari 10 A',
    city: 'Helsinki',
    id: '3d599470-3436-11e9-bc57-8b80ba54c431',
  },
  {
    name: 'Venla Ruuska',
    street: 'Nallemäentie 22 C',
    city: 'Helsinki',
    id: '3d599471-3436-11e9-bc57-8b80ba54c431',
  },
]

const typeDefs = gql`
  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Address {
    street: String!
    city: String!
  }

  # pass an object as a argument
  input PersonInput {
    name: String!
    phone: String
    street: String!
    city: String!
  }

  # fetch data
  type Query {
    personCount: Int!
    allPersons: [Person!]!
    findPersonByName(name: String!): Person
  }

  # add, edit or delete data
  type Mutation {
    addPerson(input: PersonInput!): Person
    editPhone(name: String!, phone: String!): Person
  }

  # get realtime update
  type Subscription {
    personAdded: Person!
  }
`

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPersonByName: (root, args, context, info) => {
      // https://www.graphql-tools.com/docs/resolvers/#resolver-function-signature
      // console.log(root, args, context, info)

      return persons.find((person) => person.name === args.name)
    },
  },
  // self defined resolver for address (not same as actual data structure)
  Person: {
    address: (root) => {
      console.log(root)

      return {
        street: root.street,
        city: root.city,
      }
    },
    // default resolver which is handled by graphql automatically
    // name: (root) => 'Foyez',
  },
  Mutation: {
    addPerson: (_root, { input }) => {
      const isNameExist = persons.find((person) => person.name === input.name)

      if (isNameExist) {
        throw new UserInputError('Name must be unique', {
          invalidArgs: input.name,
        })
      }

      const person = { ...input, id: uuid() }
      persons = persons.concat(person)

      // Add to subscription
      pubsub.publish('PERSON_ADDED', { personAdded: person })
      return person
    },
    editPhone: (_root, { name, phone }, context) => {
      if (name !== context.user.name) {
        throw new AuthenticationError('not authorized')
      }

      const person = persons.find((person) => person.name === name)

      if (!person) {
        throw new UserInputError('Provide correct args', { invalidArgs: { name, phone } })
      }

      const updatedPerson = { ...person, phone }
      persons.map((p) => (p.id === person.id ? updatedPerson : p))

      return updatedPerson
    },
  },
  Subscription: {
    personAdded: {
      subscribe: () => pubsub.asyncIterator(['PERSON_ADDED']),
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ user: { name: 'Foyez' } }),
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
