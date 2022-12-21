import WebSocket from 'ws'
import { readFile } from 'node:fs/promises'

const img = await readFile('./captcha.jpeg', { encoding: 'base64' })
const ws = new WebSocket('wss://s.2captcha.com')

const authData = {
    method: 'auth',
    requestId: `auth_${Date.now()}`,
    key: process.env.APIKEY || '',
    options: {
        allSessions: true,
        suppressSuccess: false
    }
}

const captchData = {
    method: 'normal',
    body: img,
    requestId: `captcha_${Date.now()}`,
    options: {
        minLen: 4,
        maxLen: 7,
        lang: 'ru'
    }
}


ws.on('open', () => {
    console.log(`connection opened`)
    ws.send(JSON.stringify(authData))
})

ws.on('close', () => {
    console.log(`Connection closed.`);
})

ws.on('message', (incomingMsg) => {
    const data = JSON.parse(incomingMsg)
    switch (data.method) {
        case 'auth':
            if (!data.success) return console.log(`Auth failed: ${data.error}`)
            console.log(`Authenticated, sending captcha...`)
            ws.send(JSON.stringify(captchData))
            break
        case 'normal':
            if (!data.success) return console.log(`Captcha not accepted: ${data.error}`)
            console.log(`Captcha accepted. Id is ${data.captchaId}`)
            break
        case 'solution':
            if (!data.success) return console.log(`Solution failed: ${data.error}`)
            console.log(`Captcha with id ${data.captchaId} is solved. The answer is: ${data.code}`)
            ws.close()
            break
        default:
            console.log(data)
    }
})

