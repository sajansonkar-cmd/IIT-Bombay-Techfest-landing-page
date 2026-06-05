function escapeHtml(value){
return value.replace(/[&<>"']/g,function(character){
return {
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[character];
});
}

function scanUser(){

const usernameInput =
document.getElementById("username");

const result =
document.getElementById("result");

if(!usernameInput || !result){
return;
}

const name =
usernameInput.value.trim();

if(name===""){
result.innerHTML =
"<p>Enter a candidate name to run the scan.</p>";
return;
}

const score =
(Math.random()*30+70).toFixed(1);

result.innerHTML =
`
<h3>${escapeHtml(name)}</h3>
<p>Compatibility Score: ${score}%</p>
`;

}

if(typeof window!=="undefined" && window.gsap){
gsap.from(".hero-content",{
opacity:0,
y:100,
duration:1.5
});

gsap.from(".hero-image",{
opacity:0,
x:100,
duration:1.5
});
}
