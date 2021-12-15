const nodemailer = require('nodemailer')
const handleBars = require('nodemailer-express-handlebars')

const tranportador = nodemailer.createTransport({
    host:"smtp.mailtrap.io",
    port:2525,
    auth:{
        user:'1210c4445bd5f3',
        pass:'81f68dba6c695b'
    },
    tls: {
    rejectUnauthorized: false,
  },
})

tranportador.use(
    'compile',
    handleBars({
        viewEngine:{
            extname:".handlebars",
            defaultLayout:false
        },
        viewPath:'./views'
    })
)
module.exports = tranportador
