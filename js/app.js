let _scope;
const BASE_URL = 'https://vmine.app';

const app = angular.module('myApp', []);
// app.controller('myCtrl', function($scope, $window, $timeout, $interval, $sce) {
app.controller('myCtrl', ['$scope', '$window', '$timeout', '$interval', '$sce', function($scope, $window, $timeout, $interval, $sce) {
	$scope.currentTab = getTab();
	
	$scope.account = null;
	$scope.handleAccountsChanged = async function(accounts, apply) {
		if (accounts.length >= 1) {
			$scope.account = {
				address: {
					full: accounts[0],
					short: getShortAccount(accounts[0])
				},
				balance: {
					wei: 0,
					formatted: '-'
				}
			};

			setLastConnection(window.usingInjected ? 1 : 0);
			loadBalance($scope, false);
			await getMyLands($scope);
			getLocationNames($scope);
			renderFans();
			for (let i = 2; i <= 10; i++) await loadRewardsData($scope, ''+i);
			await getOffers($scope);
			
			$timeout(() => {
				initRest();
			});
		}

		else {
			location.reload();
			// setLastConnection(null);
			// $scope.account = null;
		}

		if (apply) $scope.$apply();
	}
	$scope.handleChainChanged = function() {
		$window.location.reload();
	}
	$scope.verifyChain = function(chainId) {
		if (chainId != CHAIN_ID) {
			toast('Please switch network to Polygon Mainnet.', true);
			$scope.disconnectWallet();
			$scope.$apply();
		}
	}
	$scope.disconnectWallet = function() {
		deleteLastConnection();

		if (window.usingInjected) $scope.handleAccountsChanged([], false);
		else window.connector.killSession();
	}

	$scope.connectWeb3 = function() {
		if (window.ethSupported) {
			window.usingInjected = true;
			window.ethereum.enable()
				.then(function() {
					// Accounts changed listener
					window.ethereum.on('accountsChanged', function(accounts) {
						$scope.handleAccountsChanged(accounts, true);
					});

					// Get Account
					window.ethereum.request({ method: 'eth_accounts' })
						.then(accounts => $scope.handleAccountsChanged(accounts, true))
						.catch(err => toast(err.message, true));

					// Chain changed listener
					window.ethereum.on('chainChanged', $scope.handleChainChanged);

					// Get Current Chain
					window.ethereum.request({ method: 'eth_chainId' })
						.then(chainId => $scope.verifyChain(chainId))
						.catch(err => toast(err.message, true));
				})
				.catch(err => toast(err.message, true));
		} else {
			toast('No Web3 Wallet found. Consider installing MetaMask.', true)			
		}
	}
	$scope.connectWC = function() {
		bundle.openConnector($scope);
	}

	$scope.sl = {
		address: '',
		myLand: false,
		id: '',
		reward: '1 mBTC',
		status: 0,
		icon: '',
		textStatus: '-',
		newStatus: 1,
		makeOfferPrice: '',
		rating: 1,
		multiMode: 0,
		toBuyList: [],
		toInstallList: [],
		checkList: {},
		totalBuyPrice: 0,
		totalInstallPrice: 0,
		totalInstallReward: 0,
		noRadio: false
	};



	$scope.onTBLCheckChange = function(id) {
		let ids = $scope.sl.toBuyList.filter(function(id) {
			return $scope.sl.checkList[id];
		});

		$scope.sl.totalBuyPrice = (ids.length * $scope.LAND_BASE_PRICES[getRating(id) - 1]).toFixed(1);
	}

	$scope.onTILCheckChange = function(id) {
		let ids = $scope.sl.toInstallList.filter(function(id) {
			return $scope.sl.checkList[id];
		});

		$scope.sl.totalInstallPrice = (ids.length * $scope.dbRewards[$scope.sl.newStatus - 2].price).toFixed(3);
		$scope.sl.totalInstallReward = (ids.length * $scope.dbRewards[$scope.sl.newStatus - 2].daily).toFixed(3);
	}


	$scope.LAND_BASE_PRICES = [
		'0.1', '0.2', '0.3'
	];
	$scope.openLocationModal2 = function(id, myLand, status, address) {
		$scope.sl.address = $scope.landDetails[id].display;
		$scope.openLocationModal(id, myLand, status);
	}
	$scope.openLocationModal = function(id, myLand, status) {
		// console.log(id);

		$scope.sl.id = id;
		$scope.sl.rating = getRating(id);
		$scope.sl.myLand = myLand;
		$scope.sl.status = status;

		$scope.sl.textStatus = 'No Miner Installed';

		if (status == 0) $scope.sl.icon = `images/level${getRatingIndex(id)+1}.png`;
		else if (status == 1 && myLand) $scope.sl.icon = `images/mine${getRatingIndex(id)+1}.png`;
		else if (status == 1 && !myLand) $scope.sl.icon = `images/flag${getRatingIndex(id)+1}.png`;
		else {
			$scope.sl.icon = $scope.dbRewards[status - 2].icon;
			$scope.sl.textStatus = `${$scope.dbRewards[status - 2].eName} Installed`;
		}

		// console.log(myLand);

		// $scope.$apply();
		$timeout(function() {
			locationModal.open();
		});
	}
	$scope.mintMulLand = function() {
		if ($scope.account == null) {
			plsConnectWallet();
			return;
		}

		let ids = $scope.sl.toBuyList.filter(function(id) {
			return $scope.sl.checkList[id];
		});

		if (ids.length < 1) {
			toast('No unit selected', true);
			return;
		}
		mintMultiple($scope, ids);
	}
	$scope.mintLand = function() {
		if ($scope.account == null) {
			plsConnectWallet();
			return;
		}
		
		mintLand($scope);
	}
	$scope.mintLand2 = function(id, display) {
		$scope.sl.id = id;
		$scope.sl.rating = getRating(id);

		$scope.sl.address = display;
		locationModal.open();
	}
	$scope.installMiner = function() {
		locationModal.close();
		refreshView();
		minerModal.open();

		// installMiner($scope, 8);
	}
	$scope.installMulMiner = function() {
		let ids = $scope.sl.toInstallList.filter(function(id) {
			return $scope.sl.checkList[id];
		});
		if (ids.length < 1) {
			toast('No unit selected', true);
			return;
		}

		$scope.sl.id = ids[0];
		$scope.sl.newStatus = 1;
		
		$timeout(function() {
			refreshView();
			minerMulModal.open();
		});

		// alert($scope.sl.id);
	}
	$scope.installMulMiner2 = function() {
		const newStatus = $scope.sl.newStatus;

		if (newStatus < 2 || newStatus > 10) {
			toast('Select a valid miner', true);
			return;
		}

		let ids = $scope.sl.toInstallList.filter(function(id) {
			return $scope.sl.checkList[id];
		});

		updateMultiple($scope, ids, newStatus);
	}
	$scope.makeOffer = function() {
		if ($scope.account == null) {
			plsConnectWallet();
			return;
		}

		locationModal.close();
		makeOfferModal.open();
	}
	$scope.makeOffer2 = function() {
		const price = $scope.sl.makeOfferPrice;
		if (isNaN(price) || price < 0) {
			toast('Please enter a valid offer price', true);
			return;
		}

		// console.log(`Make Offer for ${$scope.sl.id}`);
		makeOffer($scope, $scope.sl.id, $scope.sl.makeOfferPrice);
	}
	$scope.cancelOffer = function(offerId) {
		cancelOffer($scope, offerId);
	}
	$scope.acceptOffer = function(offerId) {
		acceptOffer($scope, offerId);
	}

	$scope.loading = false;
	$scope.pointsLoading = getLastZoom() >= MIN_ZOOM_FOR_POINTS;
	$scope.toggleLoader = function() {
		$scope.loading = !$scope.loading;
		$scope.$apply();
	}
	$scope.onTrxResult = async function(method) {
		if (method == 'mintLand' || method == 'mintMultiple') {
			locationModal.close();
			selectModal.close();
			toast('LAND bought successfully', false);

			// await getMyLands($scope);
			// getLocationNames($scope);

			// loadPoints(map.getBounds(), true);
		}

		else if (method == 'installMiner') {
			minerModal.close();
			toast('Miner installed successfully', false);

			// loadPoints(map.getBounds(), true);
		}

		else if (method == 'claimReward') {
			toast('Mining reward claimed successfully', false);
		}

		else if (method == 'makeOffer') {
			makeOfferModal.close();
			toast('Offer posted successfully', false);
		}

		else if (method == 'cancelOffer') {
			toast('Offer Cancelled', false);
		}

		else if (method == 'acceptOffer') {
			toast('Offer Accepted', false);
		}

		$timeout(function() {
			const newUrl = `${BASE_URL}#${$scope.currentTab}`

			location.href = newUrl;
			location.reload();
		}, 1000);
	}

	$scope.DS = {
		LANDS: 0,
		BUY: 1,
		SELL: 2,
		REWARDS: 3
	};
	$scope.ds = getLastDS($scope.DS.LANDS);
	$scope.dsChange = function(newValue) {
		$scope.ds = newValue;
		setLastDS(newValue);
	}

	$scope.landDetails = {};
	$scope.dbLands = [];
	// $scope.dbOffers = [
	// 	{id: '1', price: 2},
	// ];
	// $scope.dbMiners = [
	// 	{name: 'ETC 1', icon: './images/fan3.gif', count: 3}
	// ];
	$scope.offersRcvd = [];
	$scope.offersMade = [];
	$scope.dbRewards = [
		{eType: 2, currency: 'mETC', min: 0, max: RATING_BREAKPOINTS[2], price: '1.99', daily: '1.25', eName: 'Meta ETC 1st Gen', claimed: 0, pending: 0, icon: './images/fan2.gif', cIcon: './images/etc.png'},
		{eType: 3, currency: 'mETC', min: 0, max: RATING_BREAKPOINTS[1], price: '2.99', daily: '2.5', eName: 'Meta ETC 2nd Gen', claimed: 0, pending: 0, icon: './images/fan3.gif', cIcon: './images/etc.png'},
		{eType: 4, currency: 'mETC', min: 0, max: RATING_BREAKPOINTS[0], price: '3.99', daily: '5', eName: 'Meta ETC 3rd Gen', claimed: 0, pending: 0, icon: './images/fan4.gif', cIcon: './images/etc.png'},
		
		{eType: 5, currency: 'mLTC', min: 0, max: RATING_BREAKPOINTS[2], price: '4.99', daily: '0.25', eName: 'Meta LTC 1st Gen', claimed: 0, pending: 0, icon: './images/fan5.gif', cIcon: './images/litecoin.png'},
		{eType: 6, currency: 'mLTC', min: 0, max: RATING_BREAKPOINTS[1], price: '5.99', daily: '0.5', eName: 'Meta LTC 2nd Gen', claimed: 0, pending: 0, icon: './images/fan6.gif', cIcon: './images/litecoin.png'},
		{eType: 7, currency: 'mLTC', min: 0, max: RATING_BREAKPOINTS[0], price: '6.99', daily: '1', eName: 'Meta LTC 3rd Gen', claimed: 0, pending: 0, icon: './images/fan7.gif', cIcon: './images/litecoin.png'},
		
		{eType: 8, currency: 'mBTC', min: 0, max: RATING_BREAKPOINTS[2], price: '7.99', daily: '0.0025', eName: 'Meta BTC 1st Gen', claimed: 0, pending: 0, icon: './images/fan8.gif', cIcon: './images/bitcoin.png'},
		{eType: 9, currency: 'mBTC', min: 0, max: RATING_BREAKPOINTS[1], price: '8.99', daily: '0.005', eName: 'Meta BTC 2nd Gen', claimed: 0, pending: 0, icon: './images/fan9.gif', cIcon: './images/bitcoin.png'},
		{eType: 10, currency: 'mBTC', min: 0, max: RATING_BREAKPOINTS[0], price: '9.99', daily: '0.01', eName: 'Meta BTC 3rd Gen', claimed: 0, pending: 0, icon: './images/fan10.gif', cIcon: './images/bitcoin.png'}
	];

	$scope.tokens = [
		{name: 'mBTC', supply: '21,000,000', daily: '0.0025 - 0.01'},
		{name: 'mLTC', supply: '84,000,000', daily: '0.25 - 1'},
		{name: 'mETC', supply: '210,700,000', daily: '1.25 - 5'}
	];

	$scope.installMiner2 = function() {
		const newStatus = $scope.sl.newStatus;
		if (newStatus < 2 || newStatus > 10) {
			toast('Select a valid miner', true);
			return;
		}

		installMiner($scope, newStatus);
	}
	$scope.claimReward = function(eType) {
		claimReward($scope, eType);
	}


	// featured
	$scope.featured = [
		{
			name: 'North America',
			locations: [
				{ rating: 3, display: 'Austin', points: '30.3004	-97.7522' },
				{ rating: 3, display: 'San Francisco', points: '37.7562	-122.443' },
				{ rating: 3, display: 'Manhattan', points: '40.7834	-73.9662' },
				{ rating: 3, display: 'Seattle', points: '47.6211	-122.3244' },
				{ rating: 3, display: 'Chicago', points: '41.8373	-87.6862' },
				{ rating: 3, display: 'Los Angeles', points: '34.1139	-118.4068' },
				{ rating: 3, display: 'New Orleans', points: '30.0687	-89.9288' },
				{ rating: 3, display: 'Nashville', points: '36.1715	-86.7843' },
				{ rating: 3, display: 'Miami', points: '25.7079	-80.2952' },
				{ rating: 3, display: 'Phoenix', points: '33.5722	-112.0891' },
				{ rating: 3, display: 'Omaha', points: '41.2627	-96.0522' },
				{ rating: 3, display: 'Kansas City', points: '39.1234	-94.7443' },
				{ rating: 3, display: 'Detroit', points: '42.3834	-83.1024' },

				{ rating: 3, display: 'Montreal', points: '45.5089	-73.5617' },
				{ rating: 3, display: 'Toronto', points: '43.7417	-79.3733' },
				{ rating: 3, display: 'Vancouver', points: '49.25	-123.1' },
				{ rating: 3, display: 'Ottawa', points: '45.4247	-75.695' },
				{ rating: 3, display: 'Calgary', points: '51.05	-114.0667' },
				{ rating: 3, display: 'Hamilton', points: '43.2567	-79.8692' },
				{ rating: 3, display: 'Winsdor', points: '42.3149	-83.0364' },
				{ rating: 3, display: 'Regina', points: '50.4547	-104.6067' },
				{ rating: 3, display: 'Niagra Falls', points: '43.0896	-79.0849' },
				{ rating: 3, display: 'Thunder Bay', points: '48.3822	-89.2461' },
				{ rating: 3, display: 'Brantford', points: '43.1667	-80.25' },

				{ rating: 1, display: 'Mexico City', points: '19.4333	-99.1333' },
				{ rating: 1, display: 'Oaxaca', points: '17.0833	-96.75' },
				{ rating: 1, display: 'Acapulco', points: '16.8636	-99.8825' },
				{ rating: 1, display: 'Tijuana', points: '32.525	-117.0333' },
				{ rating: 1, display: 'Cabo San Lucas', points: '22.8897	-109.9156' },
				{ rating: 1, display: 'Monterray', points: '25.6667	-100.3' },
				{ rating: 1, display: 'Morelia', points: '19.7683	-101.1894' },
				{ rating: 1, display: 'Mexicali', points: '32.6633	-115.4678' },
				{ rating: 1, display: 'La Paz', points: '24.1422	-110.3108' }
			]
		},
		{
			name: 'East Asia',
			locations: [
				{ rating: 2, display: 'Beijing', points: '39.905	116.3914' },
				{ rating: 2, display: 'Shanghai', points: '31.1667	121.4667' },
				{ rating: 2, display: 'Wuhan', points: '30.5872	114.2881' },
				{ rating: 2, display: 'Hangzhou', points: '30.25	120.1675' },
				{ rating: 2, display: 'Harbin', points: '45.75	126.6333' },
				{ rating: 2, display: 'Shenzhen', points: '22.535	114.054' },
				{ rating: 2, display: 'Nanyang', points: '32.9987	112.5292' },
				{ rating: 2, display: 'Chengdu', points: '30.66	104.0633' },
				{ rating: 2, display: 'Xiamen', points: '24.4797	118.0819' },
				{ rating: 2, display: 'Shaoxing', points: '30	120.5833' },
				
				
				{ rating: 3, display: 'Tokyo', points: '35.6897	139.6922' },
				{ rating: 3, display: 'Osaka', points: '34.75	135.4601' },
				{ rating: 3, display: 'Kyoto', points: '35.0111	135.7669' },
				{ rating: 3, display: 'Hiroshima', points: '34.4	132.45' },
				{ rating: 3, display: 'Kobe', points: '34.6913	135.183' },
				{ rating: 3, display: 'Nagoya', points: '35.1167	136.9333' },
				{ rating: 3, display: 'Yokohama', points: '35.4333	139.6333' },
				{ rating: 3, display: 'Kanazawa', points: '36.6	136.6167' },
				{ rating: 3, display: 'Kawasaki', points: '33.6	130.8153' },
				{ rating: 3, display: 'Nagasaki', points: '32.7833	129.8667' },
				{ rating: 3, display: 'Tokushima', points: '34.0667	134.55' },


				{ rating: 1, display: 'Bandung', points: '-6.95	107.5667' },
				{ rating: 1, display: 'Jakarta', points: '-6.2146	106.8451' },
				{ rating: 1, display: 'Yogyakarta', points: '-7.8014	110.3644' },
				{ rating: 1, display: 'Jayapura', points: '-2.5333	140.7167' },
				{ rating: 1, display: 'Palembang', points: '-2.9833	104.7644' },
				{ rating: 1, display: 'Bali', points: '-8.6667	115.2167' },
				{ rating: 1, display: 'Sorong', points: '-0.8667	131.25' },


				{ rating: 3, display: 'Seoul', points: '37.56	126.99' },
				{ rating: 3, display: 'Busan', points: '35.1	129.0403' },
				{ rating: 3, display: 'Changwon', points: '35.2281	128.6811' },
				{ rating: 3, display: 'Pohang-si', points: '36.0322	129.365' },
				{ rating: 3, display: 'Goyang-si', points: '37.6564	126.835' },
				{ rating: 3, display: 'Chungju-si', points: '36.9706	127.9322' },

			]
		},
		{
			name: 'Europe',
			locations: [
				{ rating: 2, display: 'Moscow', points: '55.7558	37.6178' },
				{ rating: 2, display: 'St Perersburg', points: '59.95	30.3167' },

				{ rating: 3, display: 'London', points: '42.9836	-81.2497' },
				{ rating: 3, display: 'Liverpool', points: '40.6333	-80.5677' },
				{ rating: 3, display: 'Glasgow', points: '55.8286	-4.2139' },
				{ rating: 3, display: 'Birmingham', points: '52.5249	-1.9042' },
				{ rating: 3, display: 'Oxford', points: '51.606	-1.241' },
				
				{ rating: 3, display: 'Berlin', points: '52.5167	13.3833' },
				{ rating: 3, display: 'Hamburg', points: '53.55	10' },
				{ rating: 3, display: 'Munich', points: '48.1372	11.5755' },
				{ rating: 3, display: 'Frankfurt', points: '50.1136	8.6797' },
				
				{ rating: 3, display: 'Paris', points: '48.8566	2.3522' },
				{ rating: 3, display: 'Nice', points: '43.7034	7.2663' },
				{ rating: 3, display: 'Cannes', points: '43.5513	7.0128' },
				
				{ rating: 3, display: 'Rome', points: '41.8931	12.4828' },
				{ rating: 3, display: 'Venice', points: '45.4397	12.3319' },
				{ rating: 3, display: 'Milan', points: '45.4669	9.19' },
				
				{ rating: 3, display: 'Stockholm', points: '59.3294	18.0686' },
				{ rating: 3, display: 'Helsinki', points: '60.1756	24.9342' },
				{ rating: 3, display: 'Oslo', points: '59.9111	10.7528' },
				{ rating: 3, display: 'Vienna', points: '48.2083	16.3731' },

				{ rating: 3, display: 'Warsaw', points: '52.2167	21.0333' },
				{ rating: 3, display: 'Geneva', points: '46.2	6.15' },
				{ rating: 3, display: 'Amsterdam', points: '52.3667	4.8833' },
				{ rating: 3, display: 'Madrid', points: '40.4167	-3.7167' },
				{ rating: 3, display: 'Barcelona', points: '41.3825	2.1769' },

				{ rating: 2, display: 'Prague', points: '50.0833	14.4167' },
				{ rating: 2, display: 'Kyiv', points: '50.45	30.5236' },
				{ rating: 2, display: 'Lviv', points: '49.8419	24.0315' },

				{ rating: 2, display: 'Tashkant', points: '41.2995	69.2401' },
				{ rating: 2, display: 'Kulob', points: '37.9119	69.7808' },
			]
		},
		{
			name: 'South Asia',
			locations: [
				{ rating: 1, display: 'Mumbai', points: '18.9667	72.8333' },
				{ rating: 1, display: 'Kolkata', points: '22.5411	88.3378' },
				{ rating: 1, display: 'Bengaluru', points: '12.9699	77.598' },
				{ rating: 1, display: 'Jaipur', points: '26.9167	75.8667' },
				{ rating: 1, display: 'Chennai', points: '13.0825	80.275' },
				{ rating: 1, display: 'Hyderabad', points: '17.3667	78.4667' },
				{ rating: 1, display: 'Agra', points: '27.18	78.02' },
				{ rating: 1, display: 'Pune', points: '18.5196	73.8553' },
				{ rating: 1, display: 'Ahmedabad', points: '23.03	72.58' },
				{ rating: 1, display: 'Surat', points: '21.17	72.83' },
				{ rating: 1, display: 'Kochi', points: '9.9667	76.2833' },
				{ rating: 1, display: 'Amritsar', points: '31.6167	74.85' },
				
				{ rating: 1, display: 'Lahore', points: '31.5497	74.3436' },
				{ rating: 1, display: 'Multan', points: '30.1978	71.4711' },
				{ rating: 1, display: 'karachi', points: '24.86	67.01' },
				{ rating: 1, display: 'Peshawar', points: '34	71.5' },
				{ rating: 1, display: 'Sialkot', points: '32.5	74.5333' },
				
				{ rating: 1, display: 'Kabul', points: '34.5328	69.1658' },
				{ rating: 1, display: 'Kandahar', points: '31.6078	65.7053' },
				
				{ rating: 1, display: 'Colombo', points: '6.9167	79.8333' },
				{ rating: 1, display: 'Galle', points: '6.0395	80.2194' },
				{ rating: 1, display: 'Kandy', points: '7.297	80.6385' },
			]
		},
		{
			name: 'Middle East',
			locations: [
				{ rating: 3, display: 'Jerusalem', points: '31.7833	35.2167' },
				{ rating: 3, display: 'Haifa', points: '32.8	34.9833' },
				{ rating: 3, display: 'Tel Aviv-Yafo', points: '32.08	34.78' },
				{ rating: 3, display: 'Istanbul', points: '41.01	28.9603' },
				{ rating: 3, display: 'Ankara', points: '39.93	32.85' },

				{ rating: 1, display: 'Riyadh', points: '24.65	46.71' },
				{ rating: 1, display: 'Dubai', points: '25.2697	55.3094' },
				{ rating: 1, display: 'Sharjah', points: '25.3575	55.3919' },
				
				{ rating: 1, display: 'Doha', points: '25.3	51.5333' },
				{ rating: 1, display: 'Baghdad', points: '33.35	44.4167' },
				{ rating: 1, display: 'Muscat', points: '23.6139	58.5922' },
				{ rating: 1, display: 'Jerash', points: '32.2747	35.8961' },
			]
		},
		{
			name: 'Australia',
			locations: [
				{ rating: 3, display: 'Melbourne', points: '-37.8136	144.9631' },
				{ rating: 3, display: 'Brisbane', points: '-27.4678	153.0281' },
				{ rating: 3, display: 'Perth', points: '-31.9522	115.8589' },
				{ rating: 3, display: 'Adelaide', points: '-34.9289	138.6011' },
				{ rating: 3, display: 'Canberra', points: '-35.2931	149.1269' },
				{ rating: 3, display: 'Hobart', points: '-42.8806	147.325' },
				{ rating: 3, display: 'Sydney', points: '-33.865	151.2094' },
				{ rating: 3, display: 'Mackay', points: '-21.1411	149.1861' },
				{ rating: 3, display: 'Auckland', points: '-36.85	174.7833' },
				{ rating: 3, display: 'Christchurch', points: '-43.5309	172.6365' },
				{ rating: 3, display: 'Wellington', points: '-40.876	175.064' },
				{ rating: 3, display: 'Hamilton', points: '-37.7833	175.2833' },
				{ rating: 3, display: 'Nelson', points: '-41.2931	173.2381' },
				{ rating: 3, display: 'Dunedin', points: '-45.8667	170.5' },
			]
		},
		{
			name: 'South America',
			locations: [
				{ rating: 1, display: 'Sao Paulo', points: '-3.45	-68.95' },
				{ rating: 1, display: 'Bogota', points: '4.6126	-74.0705' },
				{ rating: 1, display: 'Rio de Janeiro', points: '22.9068	-43.1729' },
				{ rating: 1, display: 'Santiago', points: '-33.45	-70.6667' },
				{ rating: 1, display: 'Caracas', points: '10.5	-66.9333' },
				{ rating: 1, display: 'Buenos Aires', points: '9.1497	-83.3334' },
				{ rating: 1, display: 'Salvador', points: '-12.9708	-38.5108' },
				{ rating: 1, display: 'Brasilia', points: '-15.7939	-47.8828' },
				{ rating: 1, display: 'Medellín', points: '6.2447	-75.5748' },
				{ rating: 1, display: 'Trujillo', points: '-8.1119	-79.0289' },
				{ rating: 1, display: 'Mar del Plata', points: '-38	-57.55' },
				{ rating: 1, display: 'Asunción', points: '11.0333	-63.8833' },
			]
		},
		{
			name: 'Africa',
			locations: [
				{ rating: 1, display: 'Cairo', points: '30.0561	31.2394' },
				{ rating: 1, display: 'Dar es Salaam', points: '-6.8	39.2833' },
				{ rating: 1, display: 'Cape Town', points: '-33.925	18.425' },
				{ rating: 1, display: 'Kinshasa', points: '-4.3233	15.3081' },
				{ rating: 1, display: 'Lagos', points: '6.45	3.4' },
				{ rating: 1, display: 'Giza', points: '29.987	31.2118' },
				{ rating: 1, display: 'Johannesburg', points: '-26.2044	28.0416' },
				{ rating: 1, display: 'Abidjan', points: '5.3364	-4.0267' },
				{ rating: 1, display: 'Nairobi', points: '-1.2864	36.8172' },
				{ rating: 1, display: 'Pretoria', points: '-25.7464	28.1881' },
				{ rating: 1, display: 'Lusaka', points: '-15.4167	28.2833' },
				{ rating: 1, display: 'Algiers', points: '36.7764	3.0586' },
				{ rating: 1, display: 'Kisumu', points: '-0.1	34.75' },
				{ rating: 1, display: 'Kigali', points: '-1.9536	30.0606' },
				{ rating: 1, display: 'Niamey', points: '13.5086	2.1111' },
				{ rating: 1, display: 'Port Said', points: '31.25	32.2833' },
				{ rating: 1, display: 'Enugu', points: '6.4403	7.4942' },
				{ rating: 1, display: 'Zaria', points: '11.0667	7.7' },
			]
		},
	];

	// open map
	$scope.openMap = function(points) {
		const latLng = points.split('\t');
		location.href = `${BASE_URL}?lng=${latLng[1]}&lat=${latLng[0]}`;
	}
	
	// loadFeatLandData([1], $scope);
	$scope.scrollLeft = function(index) {
		let count = 0;
		const i = $interval(function() {
			document.getElementsByClassName('br-cards-container')[index].scrollBy(-40, 0);
			count++;

			if (count == 10) $interval.cancel(i);
		}, 30);
	}
	$scope.scrollRight = function(index) {
		let count = 0;
		const i = $interval(function() {
			document.getElementsByClassName('br-cards-container')[index].scrollBy(40, 0);
			count++;

			if (count == 10) $interval.cancel(i);
		}, 30);
	}


	// countries
	$scope.countries = [
			{
				"name": "Afghanistan",
				"rating": 3,
				"lat": "33.9342049",
				"lng": "65.2042241"
			},
			{
				"name": "Albania",
				"rating": 2,
				"lat": "41.1529359",
				"lng": "19.9452345"
			},
			{
				"name": "Algeria",
				"rating": 3,
				"lat": "28.1420115",
				"lng": "0.6055387"
			},
			{
				"name": "Andorra",
				"rating": 1,
				"lat": "42.542386",
				"lng": "1.5897262"
			},
			{
				"name": "Angola",
				"rating": 3,
				"lat": "-11.9314096",
				"lng": "18.7612166"
			},
			{
				"name": "Anguilla",
				"rating": 3,
				"lat": "18.4365076",
				"lng": "-63.1753737"
			},
			{
				"name": "Antigua and Barbuda",
				"rating": 3,
				"lat": "16.9573056",
				"lng": "-62.3552707"
			},
			{
				"name": "Argentina",
				"rating": 3,
				"lat": "-38.4836215",
				"lng": "-64.341818"
			},
			{
				"name": "Armenia",
				"rating": 2,
				"lat": "40.0705575",
				"lng": "44.8461154"
			},
			{
				"name": "Australia",
				"rating": 1,
				"lat": "-26.7193232",
				"lng": "133.3619535"
			},
			{
				"name": "Austria",
				"rating": 1,
				"lat": "47.6964098",
				"lng": "14.7548063"
			},
			{
				"name": "Azerbaijan",
				"rating": 2,
				"lat": "40.1701141",
				"lng": "47.9920905"
			},
			{
				"name": "Bahrain",
				"rating": 3,
				"lat": "26.1239628",
				"lng": "50.6008532"
			},
			{
				"name": "Bangladesh",
				"rating": 3,
				"lat": "23.5069444",
				"lng": "89.9627788"
			},
			{
				"name": "Barbados",
				"rating": 3,
				"lat": "13.19",
				"lng": "-59.5334217"
			},
			{
				"name": "Belarus",
				"rating": 1,
				"lat": "53.7148645",
				"lng": "28.0367311"
			},
			{
				"name": "Belgium",
				"rating": 1,
				"lat": "50.5243338",
				"lng": "4.8542695"
			},
			{
				"name": "Belize",
				"rating": 3,
				"lat": "17.1823071",
				"lng": "-88.2452047"
			},
			{
				"name": "Benin",
				"rating": 3,
				"lat": "9.2231104",
				"lng": "2.3100672"
			},
			{
				"name": "Bermuda",
				"rating": 3,
				"lat": "32.321343",
				"lng": "-64.7665078"
			},
			{
				"name": "Bhutan",
				"rating": 3,
				"lat": "27.4745061",
				"lng": "90.4057846"
			},
			{
				"name": "Bolivia",
				"rating": 3,
				"lat": "-16.2819506",
				"lng": "-64.1284735"
			},
			{
				"name": "Bosnia and Herzegovina",
				"rating": 2,
				"lat": "43.9155425",
				"lng": "17.9538945"
			},
			{
				"name": "Botswana",
				"rating": 3,
				"lat": "-22.3418179",
				"lng": "24.4818352"
			},
			{
				"name": "Brazil",
				"rating": 3,
				"lat": "-14.298",
				"lng": "-49.6160669"
			},
			{
				"name": "British Virgin Islands",
				"rating": 3,
				"lat": "18.5380882",
				"lng": "-64.5170524"
			},
			{
				"name": "Brunei",
				"rating": 3,
				"lat": "4.5517834",
				"lng": "114.5020788"
			},
			{
				"name": "Bulgaria",
				"rating": 2,
				"lat": "42.7257215",
				"lng": "25.3361996"
			},
			{
				"name": "Burkina Faso",
				"rating": 3,
				"lat": "12.247047",
				"lng": "-1.1899384"
			},
			{
				"name": "Burundi",
				"rating": 3,
				"lat": "-3.3896016",
				"lng": "29.9469428"
			},
			{
				"name": "Cambodia",
				"rating": 3,
				"lat": "12.082684",
				"lng": "104.7747872"
			},
			{
				"name": "Cameroon",
				"rating": 3,
				"lat": "7.3688988",
				"lng": "13.6292639"
			},
			{
				"name": "Canada",
				"rating": 1,
				"lat": "62.5063365",
				"lng": "-102.3022254"
			},
			{
				"name": "Cape Verde",
				"rating": 3,
				"lat": "16.0282825",
				"lng": "-23.5707856"
			},
			{
				"name": "Cayman Islands",
				"rating": 3,
				"lat": "19.7031822",
				"lng": "-79.9174628"
			},
			{
				"name": "Central African Republic",
				"rating": 3,
				"lat": "6.6087499",
				"lng": "20.6508043"
			},
			{
				"name": "Chad",
				"rating": 3,
				"lat": "15.4665749",
				"lng": "18.5581738"
			},
			{
				"name": "Chile",
				"rating": 3,
				"lat": "-36.8387295",
				"lng": "-72.4583539"
			},
			{
				"name": "China",
				"rating": 2,
				"lat": "35.7591319",
				"lng": "98.8623332"
			},
			{
				"name": "Colombia",
				"rating": 3,
				"lat": "4.215506",
				"lng": "-72.7709916"
			},
			{
				"name": "Comoros",
				"rating": 3,
				"lat": "-11.8925",
				"lng": "43.3965498"
			},
			{
				"name": "Congo-Brazzaville",
				"rating": 3,
				"lat": "-0.7179165",
				"lng": "16.0180485"
			},
			{
				"name": "Cook Islands",
				"rating": 3,
				"lat": "-19.9196729",
				"lng": "-157.9753369"
			},
			{
				"name": "Costa Rica",
				"rating": 3,
				"lat": "9.5773243",
				"lng": "-83.8237112"
			},
			{
				"name": "Croatia",
				"rating": 2,
				"lat": "44.366563",
				"lng": "15.1338113"
			},
			{
				"name": "Cuba",
				"rating": 3,
				"lat": "21.5551107",
				"lng": "-80.1142033"
			},
			{
				"name": "Cyprus",
				"rating": 1,
				"lat": "35.1695632",
				"lng": "33.1396402"
			},
			{
				"name": "Czechia",
				"rating": 2,
				"lat": "49.8037838",
				"lng": "15.5281185"
			},
			{
				"name": "Democratic Republic of the Congo",
				"rating": 3,
				"lat": "-4.0324902",
				"lng": "22.4574787"
			},
			{
				"name": "Denmark",
				"rating": 1,
				"lat": "56.2010656",
				"lng": "9.4580626"
			},
			{
				"name": "Djibouti",
				"rating": 3,
				"lat": "11.8567754",
				"lng": "42.7577845"
			},
			{
				"name": "Dominica",
				"rating": 3,
				"lat": "15.397011",
				"lng": "-61.3423983"
			},
			{
				"name": "Dominican Republic",
				"rating": 3,
				"lat": "6.6819519",
				"lng": "-65.5224418"
			},
			{
				"name": "Dominican Republic",
				"rating": 3,
				"lat": "19.2866694",
				"lng": "-70.0358141"
			},
			{
				"name": "East Timor",
				"rating": 3,
				"lat": "-8.8778068",
				"lng": "125.9886923"
			},
			{
				"name": "Ecuador",
				"rating": 3,
				"lat": "-1.776685",
				"lng": "-78.5039502"
			},
			{
				"name": "Egypt",
				"rating": 3,
				"lat": "26.9182362",
				"lng": "29.61556"
			},
			{
				"name": "El Salvador",
				"rating": 3,
				"lat": "13.7132892",
				"lng": "-88.9414982"
			},
			{
				"name": "Equatorial Guinea",
				"rating": 3,
				"lat": "1.6004628",
				"lng": "10.3668965"
			},
			{
				"name": "Eritrea",
				"rating": 3,
				"lat": "15.212959",
				"lng": "38.6311031"
			},
			{
				"name": "Estonia",
				"rating": 2,
				"lat": "58.7197129",
				"lng": "24.5075795"
			},
			{
				"name": "Ethiopia",
				"rating": 2,
				"lat": "9.152872",
				"lng": "38.9964147"
			},
			{
				"name": "Falkland Islands",
				"rating": 3,
				"lat": "-51.7157777",
				"lng": "-59.5153027"
			},
			{
				"name": "Faroe Islands",
				"rating": 1,
				"lat": "61.8489975",
				"lng": "-6.9161232"
			},
			{
				"name": "Federated States of Micronesia",
				"rating": 3,
				"lat": "8.6065",
				"lng": "152.0084693"
			},
			{
				"name": "Finland",
				"rating": 1,
				"lat": "64.7696261",
				"lng": "26.989902"
			},
			{
				"name": "France",
				"rating": 1,
				"lat": "46.7995347",
				"lng": "1.8753098"
			},
			{
				"name": "Gabon",
				"rating": 3,
				"lat": "-0.8920835",
				"lng": "11.519099"
			},
			{
				"name": "Gambia",
				"rating": 3,
				"lat": "13.4429427",
				"lng": "-16.1187322"
			},
			{
				"name": "Georgia",
				"rating": 2,
				"lat": "42.3211525",
				"lng": "43.5307394"
			},
			{
				"name": "Germany",
				"rating": 1,
				"lat": "51.1850012",
				"lng": "10.5917075"
			},
			{
				"name": "Ghana",
				"rating": 3,
				"lat": "7.857371",
				"lng": "-1.0840976"
			},
			{
				"name": "Gibraltar",
				"rating": 3,
				"lat": "36.1067469",
				"lng": "-5.3352772"
			},
			{
				"name": "Greece",
				"rating": 1,
				"lat": "38.256869",
				"lng": "23.2122036"
			},
			{
				"name": "Greenland",
				"rating": 1,
				"lat": "71.8311379",
				"lng": "-38.8568272"
			},
			{
				"name": "Grenada",
				"rating": 3,
				"lat": "12.191",
				"lng": "-61.6452431"
			},
			{
				"name": "Guatemala",
				"rating": 3,
				"lat": "15.7375042",
				"lng": "-90.0740919"
			},
			{
				"name": "Guernsey",
				"rating": 1,
				"lat": "49.585438",
				"lng": "-2.505804"
			},
			{
				"name": "Guinea",
				"rating": 3,
				"lat": "9.9331035",
				"lng": "-9.6644641"
			},
			{
				"name": "Guinea-Bissau",
				"rating": 3,
				"lat": "11.6688305",
				"lng": "-15.5355638"
			},
			{
				"name": "Guyana",
				"rating": 3,
				"lat": "4.88732",
				"lng": "-58.9398799"
			},
			{
				"name": "Haiti",
				"rating": 3,
				"lat": "19.0639321",
				"lng": "-72.54429"
			},
			{
				"name": "Honduras",
				"rating": 3,
				"lat": "14.8486247",
				"lng": "-86.4726664"
			},
			{
				"name": "Hungary",
				"rating": 2,
				"lat": "47.1612473",
				"lng": "19.1356823"
			},
			{
				"name": "Iceland",
				"rating": 1,
				"lat": "64.938992",
				"lng": "-18.8175335"
			},
			{
				"name": "India",
				"rating": 3,
				"lat": "21.7616157",
				"lng": "79.0221873"
			},
			{
				"name": "Indonesia",
				"rating": 3,
				"lat": "-2.4959297",
				"lng": "120.1998098"
			},
			{
				"name": "Iran",
				"rating": 3,
				"lat": "32.3141414",
				"lng": "54.1688344"
			},
			{
				"name": "Iraq",
				"rating": 3,
				"lat": "33.22101",
				"lng": "42.5141497"
			},
			{
				"name": "Ireland",
				"rating": 1,
				"lat": "53.4294999",
				"lng": "-8.1227485"
			},
			{
				"name": "Isle of Man",
				"rating": 1,
				"lat": "54.1995",
				"lng": "-4.5438356"
			},
			{
				"name": "Israel",
				"rating": 1,
				"lat": "31.3945739",
				"lng": "34.6335839"
			},
			{
				"name": "Italy",
				"rating": 1,
				"lat": "41.7035189",
				"lng": "14.1885945"
			},
			{
				"name": "Jamaica",
				"rating": 3,
				"lat": "17.7401595",
				"lng": "-77.1969772"
			},
			{
				"name": "Japan",
				"rating": 1,
				"lat": "43.4339535",
				"lng": "142.9514467"
			},
			{
				"name": "Jersey",
				"rating": 1,
				"lat": "49.1245833",
				"lng": "-2.192616"
			},
			{
				"name": "Jordan",
				"rating": 3,
				"lat": "31.2776697",
				"lng": "36.3158738"
			},
			{
				"name": "Kazakhstan",
				"rating": 2,
				"lat": "48.0244047",
				"lng": "66.3231668"
			},
			{
				"name": "Kenya",
				"rating": 3,
				"lat": "-0.1392717",
				"lng": "37.490012"
			},
			{
				"name": "Kiribati",
				"rating": 3,
				"lat": "0.3059999",
				"lng": "173.664834"
			},
			{
				"name": "Kosovo",
				"rating": 2,
				"lat": "42.5629719",
				"lng": "20.9141829"
			},
			{
				"name": "Kuwait",
				"rating": 3,
				"lat": "29.3065716",
				"lng": "47.704009"
			},
			{
				"name": "Kyrgyzstan",
				"rating": 2,
				"lat": "41.2196872",
				"lng": "74.9773871"
			},
			{
				"name": "Laos",
				"rating": 3,
				"lat": "18.2091444",
				"lng": "104.693961"
			},
			{
				"name": "Latvia",
				"rating": 2,
				"lat": "56.8798117",
				"lng": "24.203197"
			},
			{
				"name": "Lebanon",
				"rating": 3,
				"lat": "33.8706945",
				"lng": "35.7997433"
			},
			{
				"name": "Lesotho",
				"rating": 3,
				"lat": "-29.6239639",
				"lng": "28.1743633"
			},
			{
				"name": "Liberia",
				"rating": 3,
				"lat": "6.3537424",
				"lng": "-9.7305871"
			},
			{
				"name": "Libya",
				"rating": 3,
				"lat": "26.4215275",
				"lng": "17.30332"
			},
			{
				"name": "Liechtenstein",
				"rating": 1,
				"lat": "47.1594125",
				"lng": "9.5469115"
			},
			{
				"name": "Lithuania",
				"rating": 2,
				"lat": "55.1732889",
				"lng": "24.1836807"
			},
			{
				"name": "Luxembourg",
				"rating": 1,
				"lat": "49.81534",
				"lng": "6.08663"
			},
			{
				"name": "Macedonia",
				"rating": 3,
				"lat": "41.6135715",
				"lng": "21.7502621"
			},
			{
				"name": "Madagascar",
				"rating": 3,
				"lat": "-18.7561349",
				"lng": "46.597324"
			},
			{
				"name": "Malawi",
				"rating": 3,
				"lat": "-13.2513043",
				"lng": "33.7760311"
			},
			{
				"name": "Malaysia",
				"rating": 3,
				"lat": "3.9738696",
				"lng": "101.8721699"
			},
			{
				"name": "Maldives",
				"rating": 3,
				"lat": "3.2817144",
				"lng": "73.2476579"
			},
			{
				"name": "Mali",
				"rating": 3,
				"lat": "17.5786747",
				"lng": "-0.7295449"
			},
			{
				"name": "Malta",
				"rating": 1,
				"lat": "35.944673",
				"lng": "14.3836306"
			},
			{
				"name": "Marshall Islands",
				"rating": 3,
				"lat": "11.299",
				"lng": "166.9173974"
			},
			{
				"name": "Mauritania",
				"rating": 3,
				"lat": "21.0199999",
				"lng": "-11.5737991"
			},
			{
				"name": "Mauritius",
				"rating": 3,
				"lat": "-20.1705",
				"lng": "57.597115"
			},
			{
				"name": "Mexico",
				"rating": 3,
				"lat": "23.553573",
				"lng": "-102.26752"
			},
			{
				"name": "Moldova",
				"rating": 2,
				"lat": "46.978159",
				"lng": "28.8465054"
			},
			{
				"name": "Monaco",
				"rating": 1,
				"lat": "43.6307134",
				"lng": "7.476161"
			},
			{
				"name": "Mongolia",
				"rating": 2,
				"lat": "46.8656229",
				"lng": "105.4252036"
			},
			{
				"name": "Montenegro",
				"rating": 2,
				"lat": "42.6539357",
				"lng": "19.1367833"
			},
			{
				"name": "Montserrat",
				"rating": 3,
				"lat": "16.745",
				"lng": "-62.1945522"
			},
			{
				"name": "Morocco",
				"rating": 3,
				"lat": "28.6905051",
				"lng": "-10.049781"
			},
			{
				"name": "Mozambique",
				"rating": 3,
				"lat": "-18.6278497",
				"lng": "34.8120424"
			},
			{
				"name": "Myanmar",
				"rating": 3,
				"lat": "19.0425565",
				"lng": "95.4628699"
			},
			{
				"name": "Namibia",
				"rating": 3,
				"lat": "-22.9744879",
				"lng": "17.0939596"
			},
			{
				"name": "Nauru",
				"rating": 3,
				"lat": "-0.5305",
				"lng": "166.9346956"
			},
			{
				"name": "Nepal",
				"rating": 3,
				"lat": "28.3958814",
				"lng": "83.0959726"
			},
			{
				"name": "New Zealand",
				"rating": 1,
				"lat": "-40.9587973",
				"lng": "174.1572406"
			},
			{
				"name": "Nicaragua",
				"rating": 3,
				"lat": "12.8297548",
				"lng": "-85.6006143"
			},
			{
				"name": "Niger",
				"rating": 3,
				"lat": "17.6049362",
				"lng": "9.9020541"
			},
			{
				"name": "Nigeria",
				"rating": 3,
				"lat": "8.9771774",
				"lng": "7.8077106"
			},
			{
				"name": "Niue",
				"rating": 3,
				"lat": "-19.0531286",
				"lng": "-169.8615738"
			},
			{
				"name": "Norway",
				"rating": 1,
				"lat": "78.5124025",
				"lng": "16.6055824"
			},
			{
				"name": "Oman",
				"rating": 3,
				"lat": "20.7505569",
				"lng": "57.1829746"
			},
			{
				"name": "Pakistan",
				"rating": 3,
				"lat": "30.311912",
				"lng": "70.1381972"
			},
			{
				"name": "Palau",
				"rating": 3,
				"lat": "7.3235",
				"lng": "134.495938"
			},
			{
				"name": "Panama",
				"rating": 3,
				"lat": "8.4522917",
				"lng": "-80.1270978"
			},
			{
				"name": "Papua New Guinea",
				"rating": 3,
				"lat": "-6.2100411",
				"lng": "146.0512418"
			},
			{
				"name": "Paraguay",
				"rating": 3,
				"lat": "-23.4472258",
				"lng": "-58.448737"
			},
			{
				"name": "Peru",
				"rating": 3,
				"lat": "-10.1399415",
				"lng": "-76.2775464"
			},
			{
				"name": "Philippines",
				"rating": 3,
				"lat": "12.763093",
				"lng": "122.4831733"
			},
			{
				"name": "Pitcairn Islands",
				"rating": 3,
				"lat": "-24.3712141",
				"lng": "-128.3269506"
			},
			{
				"name": "Poland",
				"rating": 2,
				"lat": "52.0179354",
				"lng": "19.195473"
			},
			{
				"name": "Portugal",
				"rating": 1,
				"lat": "39.4301247",
				"lng": "-8.5607918"
			},
			{
				"name": "Qatar",
				"rating": 3,
				"lat": "25.4289526",
				"lng": "51.2164397"
			},
			{
				"name": "Romania",
				"rating": 2,
				"lat": "45.9410443",
				"lng": "24.3030241"
			},
			{
				"name": "Russia",
				"rating": 2,
				"lat": "61.3352107",
				"lng": "93.21302"
			},
			{
				"name": "Rwanda",
				"rating": 3,
				"lat": "-1.9437001",
				"lng": "29.9706317"
			},
			{
				"name": "Saint Kitts and Nevis",
				"rating": 3,
				"lat": "17.2554999",
				"lng": "-62.6937988"
			},
			{
				"name": "Saint Lucia",
				"rating": 3,
				"lat": "13.891",
				"lng": "-60.9789442"
			},
			{
				"name": "Saint Vincent and the Grenadines",
				"rating": 3,
				"lat": "13.048",
				"lng": "-61.2121741"
			},
			{
				"name": "Samoa",
				"rating": 3,
				"lat": "-13.7575141",
				"lng": "-172.1282078"
			},
			{
				"name": "San Marino",
				"rating": 1,
				"lat": "43.9431947",
				"lng": "12.4604698"
			},
			{
				"name": "Saudi Arabia",
				"rating": 3,
				"lat": "24.2176209",
				"lng": "44.3222147"
			},
			{
				"name": "Senegal",
				"rating": 3,
				"lat": "14.4651773",
				"lng": "-14.765341"
			},
			{
				"name": "Serbia",
				"rating": 2,
				"lat": "44.2110867",
				"lng": "21.0092352"
			},
			{
				"name": "Seychelles",
				"rating": 3,
				"lat": "-4.2987937",
				"lng": "55.5890991"
			},
			{
				"name": "Sierra Leone",
				"rating": 3,
				"lat": "8.3774515",
				"lng": "-12.08237"
			},
			{
				"name": "Singapore",
				"rating": 3,
				"lat": "1.3004245",
				"lng": "103.8632309"
			},
			{
				"name": "Slovakia",
				"rating": 2,
				"lat": "48.6726975",
				"lng": "19.6367942"
			},
			{
				"name": "Slovenia",
				"rating": 2,
				"lat": "46.1490345",
				"lng": "14.6263257"
			},
			{
				"name": "Solomon Islands",
				"rating": 3,
				"lat": "-8.7053941",
				"lng": "159.1071097"
			},
			{
				"name": "Somalia",
				"rating": 3,
				"lat": "5.1978036",
				"lng": "46.9245853"
			},
			{
				"name": "South Africa",
				"rating": 3,
				"lat": "-28.5794088",
				"lng": "24.0868069"
			},
			{
				"name": "South Georgia and the South Sandwich Islands",
				"rating": 3,
				"lat": "-54.4315",
				"lng": "-36.6185932"
			},
			{
				"name": "South Korea",
				"rating": 1,
				"lat": "35.7609714",
				"lng": "127.7971469"
			},
			{
				"name": "South Sudan",
				"rating": 3,
				"lat": "7.862695",
				"lng": "29.1151525"
			},
			{
				"name": "Spain",
				"rating": 1,
				"lat": "39.9648614",
				"lng": "-2.9459282"
			},
			{
				"name": "Sri Lanka",
				"rating": 3,
				"lat": "7.878",
				"lng": "80.7038245"
			},
			{
				"name": "Sudan",
				"rating": 3,
				"lat": "15.4537439",
				"lng": "29.7951524"
			},
			{
				"name": "Suriname",
				"rating": 3,
				"lat": "4.0283474",
				"lng": "-56.1898867"
			},
			{
				"name": "Swaziland",
				"rating": 3,
				"lat": "-26.515874",
				"lng": "31.4641764"
			},
			{
				"name": "Sweden",
				"rating": 1,
				"lat": "62.0924094",
				"lng": "15.1871642"
			},
			{
				"name": "Switzerland",
				"rating": 1,
				"lat": "46.8133312",
				"lng": "8.4449473"
			},
			{
				"name": "Syria",
				"rating": 3,
				"lat": "34.8152564",
				"lng": "38.4266844"
			},
			{
				"name": "Taiwan",
				"rating": 2,
				"lat": "23.7043999",
				"lng": "120.5238804"
			},
			{
				"name": "Tajikistan",
				"rating": 2,
				"lat": "38.8590052",
				"lng": "70.9515149"
			},
			{
				"name": "Tanzania",
				"rating": 3,
				"lat": "-6.372361",
				"lng": "34.7134388"
			},
			{
				"name": "Thailand",
				"rating": 3,
				"lat": "13.03884",
				"lng": "100.8032675"
			},
			{
				"name": "The Bahamas",
				"rating": 3,
				"lat": "24.0950414",
				"lng": "-77.3766075"
			},
			{
				"name": "The Netherlands",
				"rating": 1,
				"lat": "52.237989",
				"lng": "5.5346073"
			},
			{
				"name": "Togo",
				"rating": 3,
				"lat": "8.5330285",
				"lng": "1.1029602"
			},
			{
				"name": "Tokelau",
				"rating": 3,
				"lat": "-9.155104",
				"lng": "-171.8201961"
			},
			{
				"name": "Tonga",
				"rating": 3,
				"lat": "-21.2460636",
				"lng": "-175.1165868"
			},
			{
				"name": "Trinidad and Tobago",
				"rating": 3,
				"lat": "10.7272275",
				"lng": "-61.1554272"
			},
			{
				"name": "Tunisia",
				"rating": 3,
				"lat": "33.994953",
				"lng": "9.3670977"
			},
			{
				"name": "Turkey",
				"rating": 1,
				"lat": "39.0520984",
				"lng": "35.4495026"
			},
			{
				"name": "Turkmenistan",
				"rating": 3,
				"lat": "38.9630397",
				"lng": "58.9699318"
			},
			{
				"name": "Turks and Caicos Islands",
				"rating": 3,
				"lat": "21.5538667",
				"lng": "-71.7995256"
			},
			{
				"name": "Tuvalu",
				"rating": 3,
				"lat": "-8.6405213",
				"lng": "179.1582918"
			},
			{
				"name": "Uganda",
				"rating": 3,
				"lat": "1.3769751",
				"lng": "32.723911"
			},
			{
				"name": "Ukraine",
				"rating": 2,
				"lat": "48.2818385",
				"lng": "34.0028598"
			},
			{
				"name": "United Arab Emirates",
				"rating": 3,
				"lat": "24.378073",
				"lng": "53.6353476"
			},
			{
				"name": "United Kingdom",
				"rating": 1,
				"lat": "55.367",
				"lng": "-3.9614185"
			},
			{
				"name": "United States of America",
				"rating": 1,
				"lat": "36.81843",
				"lng": "-99.0090672"
			},
			{
				"name": "Uruguay",
				"rating": 3,
				"lat": "-32.9332061",
				"lng": "-55.679799"
			},
			{
				"name": "Uzbekistan",
				"rating": 2,
				"lat": "41.3839471",
				"lng": "63.3907335"
			},
			{
				"name": "Vanuatu",
				"rating": 3,
				"lat": "-16.6334697",
				"lng": "167.9907284"
			},
			{
				"name": "Vatican City",
				"rating": 1,
				"lat": "41.9038101",
				"lng": "12.4531575"
			},
			{
				"name": "Vietnam",
				"rating": 3,
				"lat": "15.7868541",
				"lng": "108.1311854"
			},
			{
				"name": "Yemen",
				"rating": 3,
				"lat": "15.6927249",
				"lng": "47.2498182"
			},
			{
				"name": "Zambia",
				"rating": 3,
				"lat": "-13.1746066",
				"lng": "25.4548381"
			},
			{
				"name": "Zimbabwe",
				"rating": 3,
				"lat": "-19.01688",
				"lng": "29.3536501"
			}
	];

	// tutorials
	$scope.tuts = [
		{ title: 'Connect Wallet', desc: 'Learn how to connect a Web3 or Mobile wallet to the application.', icon: 'account_balance_wallet', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
		{ title: 'Claiming LAND', desc: 'Learn how to claim LAND units that are not bought by other players yet.', icon: 'flag', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
		{ title: 'Making Offers', desc: 'Learn how to make offers to buy LAND owned by other players.', icon: 'new_releases', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
		{ title: 'Selling LAND', desc: 'Learn how to view and accept offers made by other player to buy your LAND.', icon: 'thumb_up', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
		{ title: 'Installing Miner', desc: 'Learn how to install and update a mining equipment on your LAND.', icon: 'build', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
		{ title: 'Claim Mining Rewards', desc: 'Learn how to claim daily mining rewards on your LAND.', icon: 'monetization_on', link: $sce.trustAsResourceUrl('https://www.youtube.com/embed/tgbNymZ7vqY') },
	];

	_scope = $scope;

	loadWeb3($scope);
	loadContract();
}]);

function plsConnectWallet() {
	toast('Please connect wallet to perform this operation', true);
}

function getTab() {
	let tab = 'map';

	const url = location.href;
	if (url.includes('#')) tab = url.split('#')[1];

	return tab;
}

function getLastDS(defValue) {
	let lastDs = defValue;

	if (localStorage.getItem('lastDs')) lastDs = localStorage.getItem('lastDs');

	return lastDs;
}

function setLastDS(value) {
	localStorage.setItem('lastDs', value);
}