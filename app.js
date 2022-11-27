import fs from 'fs'
import cors from 'cors'
import js2php from 'js2php';
import express from 'express';
import phpServer from 'php-server';

const app = express();

app.use(cors());

app.use(express.json())

const server = await phpServer({
    binary: "C:/php/php.exe",
    port: 3001,
})



app.use(express.static('public'));


app.post('/write-php', async (req, res) => {
    try {
        const { code } = req.body;
        const html = `<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Document</title> </head> <body> ${ code} ?> </body> </html>`;
        fs.writeFileSync('index.php', html);
        res.send({message: "File write"});
    } catch (error) {
        console.log(error)
    }
} )








app.post('/to-php', async (req, res) => {
    try {
        const { code } = req.body;
        res.send({result: js2php(code).replaceAll('$console->log(', 'echo (')});
    } catch (error) {
        console.log(error);
    }
})

app.listen(3000, () => console.log('server running'));



console.log(`PHP server running at ${server.url}`);
