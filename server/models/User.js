const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    name: { type: String },
    loginId: { type: String, trim: true },
    password: { type: String },
    role: { type: Boolean, default: false },
    image: String,
    token: { type: String },
    tokenExp: { type: Number }
})
//user 정보를 저장하기 전에 실행하는 코드 -> 비밀번호 암호화
userSchema.pre('save', function(next){
    var user = this;
    //user 정보 중 비밀번호를 바꿀 때만!!
    if(user.isModified('password')) {
    //비밀번호를 암호화 시킨다
    bcrypt.genSalt(saltRounds, function(err, salt) {
        if(err) return next(err)
        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err)
            user.password = hash
            next()
         })
     })
    } else {
        next()
    }
})

userSchema.methods.comparePassword = function(planePassword, callback) {
    //planePassword : 실제 입력하는 패스워드
    //암호화된 패스워드 <-> planePassword 맞는지 비교하기
    bcrypt.compare(planePassword, this.password, function(err, isMatch) {
        if(err) return callback(err);
        callback(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb) {

    var user = this;

    //jsonwebtoken을 이용해서 token 생성하기
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    // user._id + 'secretToken' = token
    // -> 'secretToken' -> user._id

    user.token = token
    user.save(function(err, user){
        if(err) return cb(err);
        cb(null, user)
    })
    
}

userSchema.statics.findByToken = function (token, cb) {
    var user = this;
    
    // user._id + '' = token
    //복호화 하는 과정 (decode 한다)
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //유저 아이디를 이용해서 유저를 찾은 다음에
        //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인
        user.findOne({ "_id": decoded, "token": token }, function (err,user){
            if(err) return cb(err);
            cb(null, user)
        })
    })


}

const User = mongoose.model('User', userSchema)

module.exports = { User };