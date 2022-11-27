import fs from 'fs'
import cors from 'cors'
import express from 'express';
import phpServer from 'php-server';
import js2php from 'js2php';

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
        // js2php(req.body.or.replace(/(\r\n|\n|\r)/gm, " ")) ||
        const html = `<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Document</title> </head> <body> <?php ${ code} ?> </body> </html>`;
        fs.writeFileSync('index.php', html);
        res.send({message: "File write"});
    } catch (error) {
        console.log(error)
    }
} )

app.listen(3000, () => console.log('server running'));



console.log(`PHP server running at ${server.url}`);
