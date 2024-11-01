var Arr = [];
var num = 0;
function del(source){
    Arr = [];
    el(source).innerHTML = Arr;
    num = 0;
}
function log(source,output){
    Arr.push(`[${num + 1}] ${output}`);
    el(source).innerHTML += Arr[num] + "<br>";
    el(source).scrollTop = $(source).scrollHeight;
    num++;
}
function el(x){
    return document.getElementById(x);
}