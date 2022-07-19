const express = require('express')
const app = express()
const port = 5006
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { auth } = require('./middleware/auth');
const { User } = require("./models/User");
const { Client } = require('pg');

//application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

//application/json 분석해서 가져올 수 있게
app.use(express.json());
app.use(cookieParser());

const client = new Client({
    user : 'neurozen',
    host : '115.95.135.171',
    database : 'memo_ai',
    password : 'sbfhdkdl1!',
    port : 10902,
});

client.connect().then(() => console.log('Postgres 연결됨')).catch(err => console.log(err));

client.query('SELECT * FROM CENTER', (err, res) => {
    console.log(err, res);
    client.end()
});


const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...')).catch(err => console.log(err))

app.get('/', (req, res) => res.send('token password compare test'))

app.post('/register', (req, res) => {
    //회원 가입 할떄 필요한 정보들을 client에서 가져오면
    //그것들을 데이터 베이스에 넣어준다.
    const user = new User(req.body)

    user.save((err, doc) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/login', (req, res) => {
    //요청된 이메일을 데이터베이스에서 있는지 찾기
    User.findOne({ email: req.body.loginId }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "이메일에 해당하는 유저가 없습니다."
            })
        }

    //데이터 베이스에서 요청한 이메일이 있다면 비밀번호가 맞는지 확인해주기

    user.comparePassword(req.body.password, (err, isMatch) => {
        if(!isMatch)
            return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다."})
    
        //비밀번호가 맞다면 user token 생성하기
        user.generateToken((err, user) => {
            if (err) return res.status(400).send(err);

            //토큰을 저장한다. 어디에 ? 쿠키, 로컬스토리지... 등등
            res.cookie("x_auth", user.token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id }) 


            })    

        })
    })
})

//auth --> middleware 추가
app.get('/api/users/auth', auth, (req, res) => {
    console.log(req.user._id);
    //여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 True 라는 말
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.loginId,
        name: req.user.name,
        role: req.user.role,
        image: req.user.image
    })

})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
    { token: "" },
    (err, user) => {
        if (err) return res.json({ success: false, err});
        return res.status(200).send({
            success: true
        })
    })
})



app.listen(port, () => console.log(`포트실행 on port ${port}!`))