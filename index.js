const express = require('express')
const app = express()
const port = 5000

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
// application/json
app.use(bodyParser.json());
app.use(cookieParser());

const { User } = require('./models/User');

const config = require('./config/key');

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI,{
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/register', (req, res) => {
    
    //회원가입 정보 client에서 가져오면 데이터베이스에 넣어주기
    const user = new User(req.body)

    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err })
        return res.status(200).json({
            success: true
        })
    })

})

app.post('/login', (req, res) => {
    
  //요청된 e-mail을 데이터베이스에 있는지 확인
  User.findOne({email: req.body.email}, (err, user) => {
    if(!user){
      return res.json({loginSuccess: false, message: "이메일이 없습니다."})
    }

    //요청된 e-mail이 데이터베이스에 있다면 비밀번호가 맞는지 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch)
        return res.json({loginSuccess: false, message: '비밀번호가 틀렸습니다.'})
  
      //비밀번호가 맞다면 token 생성      
      user.generateToken((err, user) => {
        if(err) return res.status(400).send(err);

        //토큰을 쿠키에 저장
        res.cookie('x_auth', user.token)
          .status(200)
          .json({loginSuccess: true, userId: user._id})
      })
    })
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})