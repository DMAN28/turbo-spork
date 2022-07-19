const http = require('http')
const path = require('path')
const express = require('express')
const socketIo = require('socket.io')
const needle = require('needle')
const config = require('dotenv').config()


const TOKEN = process.env.TWITTER_BEARER_TOKEN
const PORT = process.env.PORT || 3000

const app = express()


const server = http.createServer(app)
const io = socketIo(server)

app.use(express.static("."));

app.get('/',(req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'index.html'))
})

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'

const streamURL =
'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'


const rules = [{ value: 'haas racing' },{ value: 'kevin magnussen' },{ value: 'mick schumacher' },{ value: 'f1 grand prix' },{ value: '#HungarianGP' },{ value: '#SpanishGP' },
{ value: '#FrenchGP' },{ value: '#BelgianGP' }]

//get stream rules

// async function called getRules, which is passed in the URL of the needle service and an object with headers that are required for authorization purposes.
async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    })
    console.log(response.body)
    return response.body
}

//async function will create a new post on the app with the text "rules" and send it to the server as JSON data.
async function setRules() {
    const data = {
        add: rules,
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    })
    return response.body
}



// async function that deletes rules from data base. Start by check if the data is and array.
async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null
    }

// It then creates creates a map function to iterate through each rule in the list of rules and assigns a unique ID from each rule in the data object.The data object contains a single key-value pair that deletes all of the rules with their respective id's in it.
    const ids = rules.data.map((rule) => rule.id)

    const data = {
        delete: {
            ids: ids,
        },
    }
// The code then sends a request to needle's post endpoint with the following parameters: rulesURL: https://api-needle.com/v2/rules data: { delete: { ids: ids, } }
    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
    })

    return response.body 
}


//This needle object is used to connect to twitter API retrieving tweets. It then creates a new stream object which will be used for reading tweets from the stream. I then it sets up headers that are required for connecting to the Twitter API with authorization token of "Bearer TOKEN".  
function streamTweets(socket) {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data)
            console.log(json)

            socket.emit('tweet', json)
        } catch (error) {}
    })

    return stream
}

io.on('connection', async () => {
    console.log('Client connected :)')



            let currentRules
        
        
            try {
        
                currentRules = await getRules()
        
                await deleteRules(currentRules)
        
                await setRules()
        
            } catch (error) {
                console.error(error)
                process.exit(1)
            }
        
            const filteredStream = streamTweets(io)

            let timeout = 0
            filteredStream.on('timeout', () => {
              // Reconnect on error
              console.warn('A connection error occurred. Reconnecting…')
              setTimeout(() => {
                timeout++
                streamTweets(io)
              }, 2 ** timeout)
              streamTweets(io)
            })
          })

//The code attempts to get the current rules and then exit with an error if there is one.

 server.listen(PORT, ()=> console.log(`Listening on port ${PORT}`));
