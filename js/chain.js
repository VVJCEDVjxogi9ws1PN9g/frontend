const RPC_URL = 'https://speedy-nodes-nyc.moralis.io/c8f7991de321be9413884a31/polygon/mainnet';
const CHAIN_ID = 137;
const CONTRACT_ADDRESSES = {
	land: '0xcbf959F179F7dCFeF945A4B8FBDFD9f85578D0db',
	btc: '0xDE6C20d0Af9E317e529515c7C9301224352738dE',
	ltc: '0x72220a77aCB5331981EedB5b00D73C270fB83d13',
	etc: '0x550c805b89DC444802954Bd94274692d98d31962',
};

window.usingInjected = false;

async function loadWeb3() {
	window.web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
	if (window.ethereum) window.ethSupported = true;
}

function setLastConnection(type) {
	localStorage.setItem('LCT', type);
}
function getLastConnection() {
	return localStorage.getItem('LCT');
}
function deleteLastConnection() {
	localStorage.removeItem('LCT');
}

function loadContract($scope) {
	const web3 = window.web3;
	
	const mflJson = bundle.contracts.Land;
	// const landData = mflJson.networks[CHAIN_ID];
	const landContract = new web3.eth.Contract(mflJson.abi, CONTRACT_ADDRESSES.land);
	// console.log(landData.address);

	const btcJson = bundle.contracts.BTC;
	// const btcData = btcJson.networks[CHAIN_ID];
	const btcContract = new web3.eth.Contract(btcJson.abi, CONTRACT_ADDRESSES.btc);

	const ltcJson = bundle.contracts.LTC;
	// const ltcData = ltcJson.networks[CHAIN_ID];
	const ltcContract = new web3.eth.Contract(ltcJson.abi, CONTRACT_ADDRESSES.ltc);

	const etcJson = bundle.contracts.ETC;
	// const etcData = etcJson.networks[CHAIN_ID];
	const etcContract = new web3.eth.Contract(etcJson.abi, CONTRACT_ADDRESSES.etc);

	window.contracts = {
		land: {
			contract: landContract,
			address: CONTRACT_ADDRESSES.land
		},
		btc: {
			contract: btcContract,
			address: CONTRACT_ADDRESSES.btc
		},
		ltc: {
			contract: ltcContract,
			address: CONTRACT_ADDRESSES.ltc
		},
		etc: {
			contract: etcContract,
			address: CONTRACT_ADDRESSES.etc
		}
	};

	const lct = getLastConnection();
	if (lct == 1) $scope.connectWeb3();
	else if (lct == 0) $scope.connectWC();
}

function toEth(wei) {
	if (typeof wei !== 'string') wei = wei.toString();
	return window.web3.utils.fromWei(toFixed2(wei));
}
function toWei(eth) {
	if (typeof eth !== 'string') eth = eth.toString();
	return window.web3.utils.toWei(eth);
}

function toFixed2(x) {
	if (Math.abs(x) < 1.0) {
		var e = parseInt(x.toString().split('e-')[1]);
		if (e) {
			x *= Math.pow(10, e - 1);
			x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
		}
	} else {
		var e = parseInt(x.toString().split('+')[1]);
		if (e > 20) {
			e -= 20;
			x /= Math.pow(10, e);
			x += (new Array(e + 1)).join('0');
		}
	}
	return x;
}

function getShortAccount(account) {
	return `${account.substr(0, 4)}...${account.substr(account.length - 4, 4)}`;
}

function formatBalance(balanceInWei) {
	return `${Number(toEth(balanceInWei)).toFixed(3)} MATIC`;
}

function loadBalance($scope, oneTime) {
	if ($scope.account != null) {
		// Get Account Balance
		window.web3.eth.getBalance($scope.account.address.full)
			.then(balanceInWei => {
				balanceInWei = parseInt(balanceInWei);
				$scope.account.balance = {
					wei: balanceInWei,
					formatted: formatBalance(balanceInWei)
				}

				$scope.$apply();
				// console.log($scope.account.balance.formatted);

				if (!oneTime) setLoadBalanceTimeout($scope);
			})
			.catch(_err => {
				if (!oneTime) setLoadBalanceTimeout($scope);
			});
	} else if (!oneTime) setLoadBalanceTimeout($scope);
}

function setLoadBalanceTimeout($scope) {
	setTimeout(() => {
		loadBalance($scope, false);
	}, 20000);
}

async function getMyLands($scope) {
	let data = await window.contracts.land.contract.methods.getMyLands($scope.account.address.full).call();
	data = data.filter(id => id > 0);
	$scope.account.lands = data;

	let statusData = await window.contracts.land.contract.methods.getMyLandStatuses($scope.account.address.full).call();
	statusData = statusData.filter(status => status > 0);
	
	$scope.dbLands = [];
	for (let i = 0; i < data.length; i++) {
		$scope.dbLands.push({
			id: data[i],
			status: statusData[i]
		});
	}

	// console.log(`My Lands = ${data}`);
	// console.log(`My Land Statuses = ${statusData}`);

	$scope.$apply();
}
const REQUEST_POINT_GROUP_SPACE = 2000;
async function getStatus2(loadedPoints) {
	const groups = {};
	for (i = 0; i < loadedPoints.length; i += 4) {
		const id = loadedPoints[i + 2];
		const groupId = Math.floor(id / REQUEST_POINT_GROUP_SPACE);

		if (groups.hasOwnProperty(groupId)) {
			groups[groupId].push(
				loadedPoints[i],
				loadedPoints[i + 1],
				loadedPoints[i + 2],
				loadedPoints[i + 3]
			);
		} else {
			groups[groupId] = [
				loadedPoints[i],
				loadedPoints[i + 1],
				loadedPoints[i + 2],
				loadedPoints[i + 3]
			];
		}
	}

	// console.log(groups);

	let statuses = {};
	for (let groupId in groups) {
		const statusesSub = await getStatus4(groups[groupId]);
		statuses = {...statuses, ...statusesSub};
	}

	return statuses;
}
async function getStatus4(loadedPoints) {
	let lowest, highest;
	for (i = 0; i < loadedPoints.length; i += 4) {
		const id = loadedPoints[i + 2];
		
		if (i == 0) {
			lowest = id;
			highest = id;
		} else {
			if (id < lowest) lowest = id;
			if (id > highest) highest = id;
		}
	}

	// console.log(`lowest = ${lowest}`);
	// console.log(`highest = ${highest}`);

	const data = await window.contracts.land.contract.methods.getStatus(lowest, highest).call();
	// console.log(`Statuses = ${data}`);

	const statuses = {};
	for (let i = 0; i < data.length; i++) {
		statuses[lowest + i] = data[i];
	}
	return statuses;
}

const REQUEST_POINT_LIMIT = 10000;
async function getStatus(loadedPoints) {
	let lowest, highest;
	for (i = 0; i < loadedPoints.length; i += 4) {
		const id = loadedPoints[i + 2];
		
		if (i == 0) {
			lowest = id;
			highest = id;
		} else {
			if (id < lowest) lowest = id;
			if (id > highest) highest = id;
		}
	}

	// console.log(`DTL lowest = ${lowest}`);
	// console.log(`DTL highest = ${highest}`);
	
	const loadedPointsTypes = [];
	
	const totalPoints = highest - lowest;
	const lowestOriginal = lowest;
	const highestOriginal = highest;

	let pointsRemaining = totalPoints;

	while (pointsRemaining > 0) {
		let laterLowest = lowest;
		let laterHighest = highest;

		// const pointsToLoad = highestOriginal - lowest + 2;
		// // console.log(`DTL pointsToLoad = ${pointsToLoad}`);

		if (pointsRemaining > REQUEST_POINT_LIMIT) {
			highest = lowest + REQUEST_POINT_LIMIT - 1;
			laterLowest = highest + 1;
			laterHighest = laterLowest + REQUEST_POINT_LIMIT - 1;
			if (laterHighest > highestOriginal) laterHighest = highestOriginal;
		}

		// console.log(`DTL Load = ${lowest}, ${highest}`);

		const data = await window.contracts.land.contract.methods.getStatus(lowest, highest).call();
		// console.log(`Statuses = ${data}`);

		data.forEach(pointType => loadedPointsTypes.push(pointType));
		pointsRemaining -= highest - lowest + 1;

		// console.log(`DTL pointsRemaining = ${pointsRemaining}`);

		lowest = laterLowest;
		highest = laterHighest;
	}

	return loadedPointsTypes;

	// return {
	// 	types: loadedPointsTypes,
	// 	lowest: lowestOriginal
	// };

	//
	// if (highest - lowest > REQUEST_POINT_LIMIT) {
	// 	const data = await window.contracts.land.contract.methods.getStatus(lowest, lowest + REQUEST_POINT_LIMIT).call();
	// 	// console.log(`Statuses = ${data}`);

	// 	const loadedPointsTypes = [];
	// 	data.forEach(pointType => loadedPointsTypes.push(pointType));
	// 	return {
	// 		types: loadedPointsTypes,
	// 		lowest
	// 	};
	// }
	//

	// const data = await window.contracts.land.contract.methods.getStatus(lowest, highest).call();
	// // console.log(`Statuses = ${data}`);

	// const loadedPointsTypes = [];
	// data.forEach(pointType => loadedPointsTypes.push(pointType));
	// return {
	// 	types: loadedPointsTypes,
	// 	lowest
	// };
}


function performTrx($scope, to, data, value, method) {
	if ($scope.account.balance.wei < value) {
		toast('Insufficient Balance', true);
		return;
	}

	const trx = {
		to,
		from: $scope.account.address.full,
		value: window.web3.utils.toHex(value),
		data,
		gas: '100000'
	};

	let trxRequest;
	if (window.usingInjected) trxRequest = window.ethereum.request({ method: 'eth_sendTransaction', params: [trx] });
	else trxRequest = window.connector.sendTransaction(trx);

	$scope.toggleLoader();

	trxRequest
		.then(trxHash => {
			setTimeout(() => {
				checkTrx($scope, trxHash, method);
			}, TRX_CHECK_DELAY);
		})
		.catch(err => {
			toast(err.message, true);
			$scope.toggleLoader();
			$scope.$apply();
		});
}

const TRX_CHECK_DELAY = 2000;
function checkTrx($scope, trxHash, method) {
	window.web3.eth.getTransactionReceipt(trxHash, (err, res) => {
		if (err) {
			$scope.toggleLoader();
			toast(err, true);
			return;
		}

		if (res != null) {
			$scope.toggleLoader();

			if (res.status) {
				loadBalance($scope, true);
				$scope.onTrxResult(method);
			} else {
				toast('Transaction Failed', true);
			}
		} else {
			setTimeout(() => {
				checkTrx($scope, trxHash, method);
			}, TRX_CHECK_DELAY);
		}
	});
}

const LAND_BASE_PRICES = [
	'0.1', '0.2', '0.3'
];
async function mintLand($scope) {
	// console.log($scope.sl);

	const extraData = await window.contracts.land.contract.methods['mintLand']($scope.sl.id);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts.land.address, data, window.web3.utils.toWei(LAND_BASE_PRICES[getRating($scope.sl.id) - 1]), 'mintLand');
}

async function mintMultiple($scope, ids) {
	const extraData = await window.contracts.land.contract.methods['mintMultiple'](ids);
	const data = extraData.encodeABI();
	// const value = ids.length * LAND_BASE_PRICES[getRating(ids[0]) - 1];

	let value = 0;
	const perLand = Number(LAND_BASE_PRICES[getRating(ids[0]) - 1]);
	for (let i = 0; i < ids.length; i++) {
		value += perLand;
	}

	alert(value);

	performTrx($scope, window.contracts.land.address, data, window.web3.utils.toWei(''+value), 'mintMultiple');
}

const MINER_PRICES = {
	2: '1.99',
	3: '2.99',
	4: '3.99',
	5: '4.99',
	6: '5.99',
	7: '6.99',
	8: '7.99',
	9: '8.99',
	10: '9.99'
};
async function installMiner($scope, miner) {
	// console.log($scope.sl.id);
	// console.log(miner);

	const extraData = await window.contracts.land.contract.methods['updateStatus']($scope.sl.id, miner);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts.land.address, data, window.web3.utils.toWei(MINER_PRICES[miner]), 'installMiner');
}
async function updateMultiple($scope, ids, miner) {
	const extraData = await window.contracts.land.contract.methods['updateMultiple'](ids, miner);
	const data = extraData.encodeABI();
	const value = ids.length * MINER_PRICES[miner];

	// console.log(`Sending ${ids} ${miner}`);

	performTrx($scope, window.contracts.land.address, data, window.web3.utils.toWei(''+value), 'updateMultiple');
}





function getLocationNames($scope) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
			$scope.landDetails = {...JSON.parse(xhttp.responseText), ...$scope.landDetails};
			// console.log(xhttp.responseText);
			$scope.$apply();
		}
	}
	xhttp.open('GET', `https://vmine.xyz/locations/${$scope.account.address.full}`, true);
	xhttp.send();
}


async function getOffers($scope) {
	const forDetails = [];
	
	const offersMade = await window.contracts.land.contract.methods.getOffers($scope.account.address.full, '0').call();
	const newArr1 = [];
	offersMade.forEach(offer => {
		if (offer[0] == 0) return;

		forDetails.push(offer[5]);

		newArr1.push({
			id: offer[0],
			tokenId: offer[5],
			amt: offer[6],
			amtFormatted: toEth(offer[6]) + ' MATIC'
		});
	});
	$scope.offersMade = newArr1;
	// console.log(`offersMade = ${JSON.stringify(newArr1, null, 2)}`);

	const offersRcvd = await window.contracts.land.contract.methods.getOffers($scope.account.address.full, '1').call();
	const newArr2 = [];
	offersRcvd.forEach(offer => {
		if (offer[0] == 0) return;

		newArr2.push({
			id: offer[0],
			tokenId: offer[5],
			amt: offer[6],
			amtFormatted: toEth(offer[6]) + ' MATIC'
		});
	});
	$scope.offersRcvd = newArr2;
	// console.log(`offersRcvd = ${JSON.stringify(newArr2, null, 2)}`);

	if (forDetails.length > 0) {
		postRequest(`https://vmine.xyz/select-locations/`, {ids: forDetails}, (err, res) => {
			if (!err) {
				$scope.landDetails = {...JSON.parse(res), ...$scope.landDetails};
				$scope.$apply();

				// console.log(JSON.stringify($scope.landDetails, null, 4));
			}
		});
	}
}
async function makeOffer($scope, tokenId, amt) {
	const extraData = await window.contracts.land.contract.methods['makeOffer'](tokenId);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts.land.address, data, toWei(amt), 'makeOffer');
}
async function cancelOffer($scope, offerId) {
	const extraData = await window.contracts.land.contract.methods['cancelOffer'](offerId);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts.land.address, data, '0', 'cancelOffer');
}
async function acceptOffer($scope, offerId) {
	const extraData = await window.contracts.land.contract.methods['acceptOffer'](offerId);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts.land.address, data, '0', 'acceptOffer');
}

async function loadRewardsData($scope, eType) {
	let token = '';
	if (eType >= 2 && eType <= 4) token = 'etc';
	else if (eType >= 5 && eType <= 7) token = 'ltc';
	else if (eType >= 8 && eType <= 10) token = 'btc';

	const data = await window.contracts[token].contract.methods.rewardData($scope.account.address.full, eType).call();
	// console.log(`Reward = ${data}`);

	$scope.dbRewards[eType - 2].claimed = toEth(data[0]);
	$scope.dbRewards[eType - 2].pending = toEth(data[1]);
	$scope.$apply();
}
async function claimReward($scope, eType) {
	let token = '';
	if (eType >= 2 && eType <= 4) token = 'etc';
	else if (eType >= 5 && eType <= 7) token = 'ltc';
	else if (eType >= 8 && eType <= 10) token = 'btc';

	const extraData = await window.contracts[token].contract.methods['claimReward'](eType);
	const data = extraData.encodeABI();

	performTrx($scope, window.contracts[token].address, data, 0, 'claimReward');
}



function postRequest(url, body, callback) {
	const xhttp = new XMLHttpRequest();
	
	xhttp.open('POST', url);
	xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(body));
	
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200) {
			callback(null, xhttp.responseText);
		}
	}
}


function getRequest(url, callback) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState == XMLHttpRequest.DONE) {
			if (xhttp.status == 200) callback(null, JSON.parse(xhttp.responseText));
			else callback(`ERROR ${xhttp.status}`, null);
		}
	}
	xhttp.open('GET', url, true);
	xhttp.send();
}


const RATING_BREAKPOINTS = [207974, 516027, 1015195];
function getRatingIndex(id) {
	if (id <= RATING_BREAKPOINTS[0]) return 0;
	else if (id <= RATING_BREAKPOINTS[1]) return 1;
	
	return 2;
}
function getRating(id) {
	if (id <= RATING_BREAKPOINTS[0]) return 3;
	else if (id <= RATING_BREAKPOINTS[1]) return 2;
	
	return 1;
}


function getSelectNames($scope, ids) {
	postRequest(`https://vmine.xyz/select-locations/`, {ids}, (err, res) => {
		if (!err) {
			$scope.landDetails = {...JSON.parse(res), ...$scope.landDetails};
			$scope.$apply();

			// console.log('getSelectNames' + JSON.stringify($scope.landDetails, null, 4));
		}
	});
}