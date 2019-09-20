

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
  
times = 0;
while (times < 100) {
    console.log(getRandomInt(1,5))
    times = times + 1
}