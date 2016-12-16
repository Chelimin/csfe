const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.listen(3000)
app.get('/results', (req, res) => {
  if (false) {
    return res.render('results')
  }
  res.send('noooob')
})
app.get('/card', (req, res) => {
  res.json('hahah')
})
