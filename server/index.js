const needle = require('needle')
const config = require('dotenv').config()
const TOKEN = process.env.TWITTER_BEARER_TOKEN

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'

const streamURL =
    'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'


const rules = [{ value: 'Haas racing' }, { value: 'Mick Schumacher' }, { value: 'Kevin Magnussen' }]

//get stream rules

// async function called getRules, which is passed in the URL of the needle service and an object with headers that are required for authorization purposes.
async function getRules() {
    const response = await needle('get', rulesURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    })
    return response.body
}

//async function will create a new post on the app with the text "rules" and send it to the server as JSON data.
async function setRules() {
    const data = {
        add: rules
    }
    const response = await needle('post', rulesURL, data, {
        headers: {
            'content-type': 'application/JSON',
            Authorization: `Bearer ${TOKEN}`,
        },
    })
    return response.body
}



async function deleteRules(rules) {
    if (!Array.isArray(rules.data)) {
        return null
    }

    const ids = rules.data.map((rule) => rule.id)
    const data = {
        delete: {
            ids: ids,
        },
    }

}

function streamTweets() {
    const stream = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        }
    })

    stream.on('data', (data) => {
        try {
            const json = JSON.parse(data)
            console.log(json)
            socket.emit('tweet', json)
        } catch (error) { }
    })

    return stream
}

//The code attempts to get the current rules and then exit with an error if there is one.
; (async () => {
    let currentRules


    try {

        currentRules = await getRules()

        await deleteRules(currentRules)

        await setRules()

    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    streamTweets()
})()

