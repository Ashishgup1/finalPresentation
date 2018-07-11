// Initial requirements
let Stellar				= require('stellar-sdk'); // Stellar JS library
let request				= require('request-promise'); // Request library
let stellarUtility 		= require("./stellarUtilities.js"); // File containing Stellar utility functions for managing API
let Set					= require("collections/set"); 
let Engine 			 	= require('./engine.js');
let Buyer				= require('./Buyer.js');
let Seller				= require('./Seller.js');
let base58 				= require("bs58");
let log4js 				= require('log4js');
let winston				= require('winston');
let bodyParser 			= require('body-parser');
let mysql 				= require ('mysql');
let	fs 					= require("fs");
function addSave(console){

console.save = function(data){
		msg = data + "\n";
		fs.appendFile("./log.txt", msg, function(){
			console.log(data);
		})
	}
}

addSave(console);

//Pricing Engine code
let historyList = new Array();

for(let i=0;i<10;i++)
{
	tempList = new Array();
	for(let j=0;j<300;j++)
	{
		tempList.push(300);
	}
	historyList.push(tempList);
}

let gparamList = new Array();

for(let i=0;i<200;i++)
{
	gparamList.push(i%10);
}

function PriceEngine()
{
	//Need, Unique, ownerValue, Demand, Richness, Applicability, repeatedPurchase, gparam
	let q = 0.97
	let nHist = 200

	let buyer = new Buyer(historyList, nHist, q, gparamList, 0.9, 0.9, 0.9, 0.9, 0.1, 0.1, 0.1, 2),	
		seller = new Seller(historyList, nHist, q, gparamList, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 2);
	
	return Engine.transact_price(buyer, seller, historyList, gparamList).toFixed(2);
}

//Server Side code for elastic search

var elasticsearch = require('elasticsearch');

let anoncnt = 1;

var client = new elasticsearch.Client({
	host: '10.4.100.238:9200',
	log: 'trace'
});

async function getPossibleUserNames(keyword) { //Used to query database for keyword and return a list of possible usernames

	var ans = await client.search({
		index: 'user_data',
		q: 'Keywords:' + keyword
	});

	var matches = new Set();

	let searchResults = "";
	for(var i = 0; i< ans.hits.hits.length; i++)
	{
		matches.add(ans.hits.hits[i]._source['username']);
	}

	var arr = matches.toArray();

	for(var i=0;i<arr.length;i++)
	{
		searchResults+=arr[i] + ': ' +	PriceEngine() + ' ';
	}

	return searchResults;
}

async function pushToElasticSearch(fileData) { //Used to push a user data to elastic search

	let count = {};

	try
	{
		count = await client.count({
		index: 'user_data'
		});
	}
	
	catch(err)
	{
		console.save(err);
		count.count = 0;
	}

	var obj = {
		index: 'user_data',
		type: 'user',
		id: count.count + 1
	};

	obj.body = fileData;
	client.create(obj, function(error) {
		if (error) {
			console.save('Error boi');
		} else {
			console.save('All is well boi');
		}
	});
}

let pairIssuer = Stellar.Keypair.fromSecret("SBB76ASGMOEU7M2RIE2DXWUNCYNPQDVJQNBEPLZHOO5NXPEWWGGFSFCJ");

let ZFCasset = new Stellar.Asset('ZFC', pairIssuer.publicKey());

//Code for encoding and decoding IPFS Hash

getBytes32FromIpfsHash = (ipfsListing) => { //Encode
	console.save(base58.decode(ipfsListing).slice(2).toString('hex'));
	return base58.decode(ipfsListing).slice(2).toString('hex');
}

getIpfsHashFromBytes32 = (bytes32Hex) => { //Decode 
	const hashHex = "1220" + bytes32Hex
	const hashBytes = Buffer.from(hashHex, 'hex');
	const hashStr = base58.encode(hashBytes)
	console.save(hashStr);
	return hashStr;
}

//Server Side code for Chat Engine

const alert = require ('alert-node')

const express = require('express')
const app = express()

var users = {};
var timer = {};
var data_Acceptor = {};
var money_Acceptor = {};
var amnt = {};
var checkflag = {};
var inprocess = {};
var publickey = {};
var secretkey = {};
var filehash = {};

users["Anonymous"]=null

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.get('/', (req, res) => {
	res.render('index', {
		ip: ""
	})
})

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function ValidateIPaddress(ipaddress) {
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
		return (true)
	}
	return (false)
}

for(var key in inprocess)
	console.save(key);

server = app.listen(3000)

const io = require("socket.io")(server)

io.sockets.on('connection', (socket) => {

	socket.username = "Anonymous" + anoncnt;

	anoncnt++;

	socket.broadcast.emit('new_message', {
		message: socket.username + " has joined the chat",
		username: "Liveweaver"
	});

	socket.on('change_username', (data) => {
		if(data.username in users)
		{
			users[socket.username].emit("new_message", {
				message: "Username already taken",
				username: "Liveweaver"
			})
		}
		else
		{
			io.sockets.emit('new_message', {
				message: socket.username + " has changed his username to " + data.username,
				username: "Liveweaver"
			});

			delete users[socket.username];

			socket.username = data.username
			users[socket.username] = socket;
		}
	})

	users[socket.username] = socket;

	socket.on('new_message', async (data) => {

		var msg = data.message.trim();
		if(checkflag[socket.username]!=1)
		{
			if(msg.substr(0, 3) == "/w ") {
				msg = msg.substr(3);
				var ind = msg.indexOf(" ");
				if (ind !== -1) {
					var name = msg.substr(0, ind);
					var msg = msg.substr(ind + 1);
					if (name in users) {
						users[name].emit("new_message", {
							message: msg,
							username: socket.username + " whispered to you"// + name
						})
						users[data.name].emit("new_message", {
							message: msg,
							username: "You whispered to " + name
						})
						console.save("Whisper");
					} 
					else 
					{
						console.save(data.name);
						users[data.name].emit("new_message", {
							message: "Wrong username",
							username: "Liveweaver"
						})
						alert("Error", "Wrong username entered");
						console.save("User not found");
					}
				} 
				else 
				{
					console.save("Fail");
				}
			} 
			else if(msg.substr(0, 4)=="add ")
			{
				var keywords=msg.substr(4);

				let fileData = {
					username : socket.username,
					Keywords : keywords
				};

				await pushToElasticSearch(fileData);

				io.sockets.emit('new_message', {
					message: data.message,
					username: socket.username
				});
			}
			else if(msg.substr(0, 9)=="retrieve ")
			{
				var keywords=msg.substr(9);

				var usernames= await getPossibleUserNames(keywords);

				users[socket.username].emit('new_message', {
					message: "These usernames have the required information:\n" + usernames,
					username: "Liveweaver"
				});

			}
			else if(msg.substr(0,5)=="send ")
			{
				var user=msg.split(" ");
				var name=user[1];
				var amount=user[2];
				if(!(name in users))
				{
					users[socket.username].emit('new_message', {
					message: "Wrong username entered. Please try again.",
					username: "Liveweaver"
					});
				}
				else
				{
					users[name].emit('new_message', {
					message: socket.username+" wants to send you " + amount +" ZFC in exchange of the data, do you want to proceed with the transaction? (Press Y/N)",
					username: "Liveweaver"
					});
					money_Acceptor[socket.username]=name;
					data_Acceptor[name]=socket.username;
					amnt[socket.username]=amount;
					timer[socket.username]=Date.now();
				}
			}
			else if(msg=="Y"||msg=="N")
			{
				if(socket.username in data_Acceptor)
				{
					if(Date.now()-timer[data_Acceptor[socket.username]]<=60000)
					{
						if(msg=="Y")
						{
							users[socket.username].emit('new_message', 
							{
								message: "Transaction has been accepted. Enter your public, secret key and Hash of the file separated by one space each.",
								username: "Liveweaver"
							});
							users[data_Acceptor[socket.username]].emit('new_message', 
							{
								message: socket.username+" has accepted the transaction. Enter your public and secret key separated by a space.",
								username: "Liveweaver"
							});
							checkflag[data_Acceptor[socket.username]]=1;
							checkflag[socket.username]=1;
							inprocess[data_Acceptor[socket.username]]=socket.username;
						}		
						else
						{
							users[socket.username].emit('new_message', 
							{
								message: "Transaction has been denied",
								username: "Liveweaver"
							});
							users[data_Acceptor[socket.username]].emit('new_message', 
							{
								message: socket.username+" has denied the transaction",
								username: "Liveweaver"
							});
							delete money_Acceptor[data_Acceptor[socket.username]];
							delete data_Acceptor[socket.username];
							delete timer[data_Acceptor[socket.username]];
							delete amnt[data_Acceptor[socket.username]];
							delete inprocess[data_Acceptor[socket.username]];
						}	
					}
					else
					{
						users[socket.username].emit('new_message', 
						{
							message: "No valid transaction exists",
							username: "Liveweaver"
						});
					}
				}
				else
				{
					users[socket.username].emit('new_message', 
					{
						message: "No valid transaction exists",
						username: "Liveweaver"
					});
				}
			}
			else if(msg == "Create account")
			{
				console.save("Creation");
				let newKeyPair = Stellar.Keypair.random();
				await stellarUtility.createAndFundAccount(newKeyPair);
   				await stellarUtility.changeTrust(newKeyPair, "10000", ZFCasset);
    			await stellarUtility.sendAsset(pairIssuer, newKeyPair, '1000', ZFCasset);
    			await stellarUtility.showBalance(newKeyPair);
   				users[socket.username].emit('new_message', 
				{
					message: "New account created. Public Key: " + newKeyPair.publicKey() + " Secret Key: " + newKeyPair.secret(),
					username: "Liveweaver"
				});
			}
			else 
			{
				io.sockets.emit('new_message', {
					message: data.message,
					username: socket.username
				});
			}
		}
		else
		{
			console.save("Reached here");
			var message=msg.split(" ");
			var pub=message[0];
			var sec=message[1];
			if(socket.username in data_Acceptor)
			{
				var hash=message[2];
				console.save(socket.username);
				console.save(hash);
				filehash[socket.username]=hash;
			}

			publickey[socket.username]=pub;
			secretkey[socket.username]=sec;
			
			checkflag[socket.username]=0;
		}

		var temp={};

		for(var key in inprocess)
		{
			if(inprocess.hasOwnProperty(key))
			{
				if(key in publickey && inprocess[key] in publickey)
				{
					users[key].emit('new_message', 
					{
						message: "Transaction has started",
						username: "Liveweaver"
					});


					users[inprocess[key]].emit('new_message', 
					{
						message: "Transaction has started",
						username: "Liveweaver"
					});

					console.save(secretkey[key]);
					console.save(secretkey[inprocess[key]]);

					var moneySender=await Stellar.Keypair.fromSecret(secretkey[key]);

					console.save(moneySender.publicKey());

					var dataSender=await Stellar.Keypair.fromSecret(secretkey[inprocess[key]]);

					console.save(dataSender.publicKey());

					var escrow=await Stellar.Keypair.fromSecret("SD3CX5QBRCHLMFRICH6WAARYO3IFE2ZQRTAWKT65FATLF253E27HQNUP");

					console.save(escrow.publicKey());

					var money = amnt[key];

					console.save(money);

					var hash=filehash[inprocess[key]];

					console.save(hash);
					console.save(typeof hash);

					var encoded = getBytes32FromIpfsHash(hash);

					console.save(typeof money);

					await stellarUtility.transact(dataSender, escrow, moneySender, ZFCasset, money, encoded, "10000");

					var decoded = getIpfsHashFromBytes32(encoded);

					users[key].emit('new_message', 
					{
						message: "The IPFS Hash of the required file is: " + decoded,
						username: "Liveweaver"
					});


					users[inprocess[key]].emit('new_message', 
					{
						message: "You have received " + money + " ZFC tokens",
						username: "Liveweaver"
					});

					delete money_Acceptor[key];
					delete data_Acceptor[inprocess[key]];
					delete timer[key];
					delete amnt[key];
					delete publickey[key];
					delete publickey[inprocess[key]];
					delete inprocess[key];
					temp[data_Acceptor[socket.username]];
				}
			}
		}

	})

	socket.on('typing', (data) => {
		socket.broadcast.emit('typing', {
			username: socket.username
		})
	})

	socket.on('disconnect', (data) => {

		delete users[socket.username];

		io.sockets.emit('new_message', {
			message: socket.username + " has left",
			username: "Liveweaver"
		});
	})

	socket.on('disconnecting', (data) => {
		socket.emit('new_message', {
			message: "Do you really want to quit?",
			username: "Liveweaver"
		});
	})

})