const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 7
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})


userSchema.pre('save', function(next){
    var user = this;

    if(user.isModified('password')){
        //비밀번호 암호화(bcrypt)
        bcrypt.genSalt(saltRounds, function(err, salt){
            if (err) return next(err)

            bcrypt.hash(user.password, salt, function(err, hash){
                if (err) return next(err)
                user.password = hash
                next()
            })
        })
    }
    else {
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, cbfn){

    //plainPassword 와 암호화 된 password가 같은지 확인
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cbfn(err)
        cbfn(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cbfn){

    var user = this;

    //jsonwebtoken 을 사용해서 token 생성
    var token = jwt.sign(user._id.toHexString(), 'secret')
    user.token = token
    user.save(function(err, user){
        if(err) return cbfn(err)
        cbfn(null, user)
    })
}

userSchema.statics.findByToken = function(token, cbfn) {
    var user = this;

    //토큰을 decode
    jwt.verify(token, 'secret', function(err, decoded){
        //유저 아이디를 이용해서 유저를 찾은 다음에 클라이언트에서 가져온 토큰과 데이터베이스에 보관된 토큰이 일치하는지 확인
        user.findOne({'_id':decoded, 'token':token}, function(err, user){
            if(err) return cbfn(err);
            cbfn(null, user)
        })
    })
}


const User = mongoose.model('User', userSchema)

module.exports = { User }