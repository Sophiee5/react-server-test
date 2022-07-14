//환경변수에 따라 dev.js or prod.js(헤로쿠 등의 배포 프로그램 연결)의 URI를 연결해주기
if(process.env.NODE_ENV === 'production') {
    module.exports = require('./prod');
} else {
    module.exports = require('./dev');
}