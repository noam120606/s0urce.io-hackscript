let config, vars, app, loops, gui;
config = {
	message: "papa bless, it's everyday bro /r/javascript",
	autoTarget: true,
	autoAttack: true,
	db: "https://raw.githubusercontent.com/noam120606/s0urce.io-hackscript/master/db.json",
	freq: {
		word: 1500,
		mine: 3000,
		upgrade: 4500,
		broke: 6000,
		hack: 3500
	},
	playerToAttack: 0,
	maxHackFails: 2,
	maxMinerLevel: 100,
	maxQBLevel: 200,
	maxUpgradeCost: .33,
	gui: {
		enabled: true,
		width: "320px",
		height: "412px"
	},
	ocr: {
		enabled: false,
		url: "http://api.ocr.space/parse/image",
		key: "XXX"
	}
};
vars = {
	listingURL: {},
	listingB64: {},
	balance: 0,
	flags: {
		ocrBlock: false,
		progressBlock: false
	},
	loops: {
		word: null,
		upgrade: null,
		miner: null
	},
	hackProgress: 0,
	hackFailures: 0,
	minerStatus: [
		{ name: "shop-basic-miner", value: 0 },
		{ name: "shop-advanced-miner", value: 0 },
		{ name: "shop-mining-drill", value: 0 },
		{ name: "shop-data-center", value: 0 },
		{ name: "shop-bot-net", value: 0 },
		{ name: "shop-quantum-server", value: 0 }
	],
	fireWall: [
		{ name: "A", index: 1, needUpgrade: true },
		{ name: "B", index: 2, needUpgrade: true },
		{ name: "C", index: 3, needUpgrade: true },
		{ name: "ALL", needUpgrade: true }
	],
	gui: {
		dragReady: false,
		dragOffset: { x: 0, y: 0 }
	}
};
app = {
	start: () => {
		$.get(config.db).done((data) => {
			vars.listingB64 = JSON.parse(data);
			if ($("#player-list").is(":visible") === false) {
				log("* la Target list doit être ouverte");
				$("#desktop-list").children("img").click();
			}
			if ($("#window-shop").is(":visible") === false) {
				log("* le Black market doit être ouvet");
				$("#desktop-shop").children("img").click();
				$("#desktop-miner").children("img").click();
			}
			if ($("#window-computer").is(":visible") === false) {
				log("* le My computer doit être ouvert");
				$("#desktop-computer").children("img").click();
			}
			if (config.gui.enabled === true) {
				log("* ouverture de la fenêtre du bot");
				if ($("#custom-gui").length > 0) {
					$("#custom-gui").show();
				} else {
					gui.show();
				}
			} else {
				log("* GUI disabled, skipping...");
			}
			app.automate();
		});
	},
	restart: () => {
		app.stop();
		log(". attendre pour le restart");
		setTimeout(() => {
			log(". le bot restart");
			app.automate();
		}, config.freq.hack);
	},
	stop: () => {
		for (const loop in vars.loops) {
			if (vars.loops[loop] === null) {
				log(`! je ne peut pas areter : ${loop} loop`);
				continue;
			}
			clearInterval(vars.loops[loop]);
			vars.loops[loop] = null;
		}
		vars.hackProgress = 0;
		vars.flags.ocrBlock = false;
		vars.flags.progressBlock = false;
		log("* arret de tout les hacks");
	},
	automate: () => {
		app.attack();
		if (vars.loops.miner === null) {
			vars.loops.miner = setInterval(loops.miner, config.freq.mine);
		}
		if (vars.loops.upgrade === null) {
			vars.loops.upgrade = setInterval(loops.upgrade, config.freq.upgrade);
		}
	},
	attack: () => {
		if (config.autoTarget) {
			const rndTarget = getRandomInt(config.playerToAttack, config.playerToAttack + 3);
			const targetName = $("#player-list").children("tr").eq(rndTarget)[0].innerText;
			log(`. j'attaque maintenant ${targetName}`);
			$("#player-list").children("tr").eq(rndTarget)[0].click();
			$("#window-other-button").click();
		}
		if (config.autoAttack) {
			const portNumber = getRandomInt(1, 3);
			const portStyle = $(`#window-other-port${portNumber}`).attr("style");
			if (portStyle.indexOf("opacity: 1") === -1) {
				log("* le cout du hack est trop cher, attente");
				setTimeout(app.attack, config.freq.broke);
				return;
			}
			$(`#window-other-port${portNumber}`).click();
		}
		if (vars.loops.word === null) {
			vars.loops.word = setInterval(loops.word, config.freq.word);
		}
	},
	findWord: () => {
		const wordLink = $(".tool-type-img").prop("src");
		if (!wordLink.endsWith("s0urce.io/client/img/words/template.png")) {
			if (vars.listingURL.hasOwnProperty(wordLink) === true) {
				const word = vars.listingURL[wordLink];
				log(`. Found word (URL): [${word}]`);
				app.submit(word);
				return;
			}
			toDataURL(wordLink).then((dataUrl) => {
				const hash = getHashCode(dataUrl);
				if (vars.listingB64.hasOwnProperty(hash) === true) {
					const word = vars.listingB64[hash];
					log(`. Found word (B64): [${word}]`);
					app.learn(word);
					return;
				}
				if (config.ocr.enabled === true) {
					log("* Not seen, trying OCR...");
					app.doOCR(config.ocr.url, {
						apikey: config.ocr.key,
						language: "eng",
						url: wordLink
					});
				} else {
					log("* OCR désactivé, attente...");
				}
			});
		} else {
			log("* je ne trouve pas le lien du mot...");
			if ($("#cdm-text-container span:last").text() === "Target is disconnected from the Server." && !config.autoTarget) {
				$("#custom-autoTarget-button").click();
			}
			app.restart();
		}
	},
	learn: (word) => {
		const wordLink = $(".tool-type-img").prop("src");
		vars.listingURL[wordLink] = word;
		app.submit(word);
	},
	submit: (word) => {
		$("#tool-type-word").val(word);
		$("#tool-type-word").submit();
	},
	doOCR: (link, payload) => {
		vars.flags.ocrBlock = true;
		$.post(link, payload).done((data) => {
			const word = String(data["ParsedResults"][0]["ParsedText"]).trim().toLowerCase().split(" ").join("");
			if (word.length > 2) {
				log(`. data trouvé: [${word}]`);
				$("#tool-type-word").val(word);
				app.learn(word);
				vars.flags.ocrBlock = false;
			} else {
				log("* OCR fail");
				app.restart();
			}
		});
	}
};
loops = {
	word: () => {
		if (vars.flags.ocrBlock === true) {
			return;
		}
		if ($("#targetmessage-input").is(":visible") === true) {
			$("#targetmessage-input").val(config.message);
			$("#targetmessage-button-send").click();
			app.restart();
			return;
		}
		if (vars.flags.progressBlock === true) {
			const newHackProgress = parseHackProgress($("#progressbar-firewall-amount").attr("style"));
			if (vars.hackProgress === newHackProgress) {
				log("* Progress bar hasn't moved, waiting");
				vars.hackFails++;
				if (vars.hackFails >= config.maxHackFails) {
					vars.hackFails = 0;
					log("* restart...");
					vars.listingURL = {};
					app.restart();
				}
				return;
			}
			vars.hackFails = 0;
			vars.hackProgress = newHackProgress;
			vars.flags.progressBlock = false;
		}
		vars.flags.progressBlock = true;
		app.findWord();
	},
	miner: () => {
		for (const miner of vars.minerStatus) {
			miner.value = parseInt($(`#${miner.name}-amount`).text());
			if ($(`#${miner.name}`).attr("style") === "opacity: 1;") {
				if (miner.value >= config.maxQBLevel) {
					continue;
				}
				const isAdvancedMiner = (miner.name === "shop-quantum-server" || miner.name === "shop-bot-net") ? true : false;
				if (miner.value >= config.maxMinerLevel && isAdvancedMiner === false) {
					continue;
				}
				$(`#${miner.name}`).click();
			}
		}
	},
	upgrade: () => {
		if (!vars.fireWall[3].needUpgrade)
			return;
		const i = getRandomInt(0, 2);
		const index = vars.fireWall[i].index;
		if (!vars.fireWall[i].needUpgrade)
			vars.loops.upgrade();
		vars.balance = parseInt($("#window-my-coinamount").text());
		if ($("#window-firewall-pagebutton").is(":visible") === true) {
			$("#tutorial-firewall").css("display", "none");
			$("#window-firewall-pagebutton").click();
		}
		log(`. amelioration des défences ${vars.fireWall[i].name}`);
		$(`#window-firewall-part${index}`).click();
		const stats = [
			parseInt($("#shop-max-charges").text()), parseInt($("#shop-strength").text()), parseInt($("#shop-regen").text())
		];
		const statLookup = [
			"max_charge10", "difficulty", "regen"
		];
		const maxStats = [
			30, 4, 10
		];
		let maxUpgradeCount = 0;
		for (const stat in maxStats) {
			if (stats[stat] < maxStats[stat]) {
				const statPrice = parseInt($(`#shop-firewall-${statLookup[stat]}-value`).text());
				if (statPrice < (vars.balance * config.maxUpgradeCost)) {
					log(`. Buying: ${$(".window-shop-element-info b").eq(stat).text()}`);
					$(`#shop-firewall-${statLookup[stat]}`).click();
				}
			} else {
				maxUpgradeCount++;
				if (maxUpgradeCount === 3) {
					vars.fireWall[i].needUpgrade = false;
					if (vars.fireWall.every(checkFirewallsUpgrades))
						vars.fireWall[3].needUpgrade = false;
				}
			}
		}
		if ($("#window-firewall-pagebutton").is(":visible") === true) {
			$("#window-firewall-pagebutton").click();
		}
	}
};

gui = {
	show: () => {
		const sizeCSS = `height: ${config.gui.height}; width: ${config.gui.width};`;
		const labelMap = {
			word: "mots",
			mine: "amelioration des mineurs",
			upgrade: "défences",
			hack: "attente hack"
		};
		const freqInput = (type) => {
			return `<span style="font-size:15px">
				${labelMap[type]}:
				<input type="text" class="custom-gui-freq input-form" style="width:50px;margin:0px 0px 15px 5px;border:" value="${config.freq[type]}" data-type="${type}">
				<span>(ms)</span><br>
			</span>`;
		};
		const botWindowHTML = `
		<div id="custom-gui" class="window" style="border-color: rgb(62, 76, 95); color: rgb(191, 207, 210); ${sizeCSS} z-index: 10; top: 11.5%; left: 83%;">
			<div id="custom-gui-bot-title" class="window-title" style="background-color: rgb(62, 76, 95);">
				Hack script (by Noam#2559)
				<span class="window-close-style">
					<img class="window-close-img" src="http://s0urce.io/client/img/icon-close.png">
				</span>
			</div>
			<div class="window-content" style="${sizeCSS}">
				<div id="custom-restart-button" class="button" style="display: block; margin-bottom: 15px">
					Restart le bot
				</div>
				<div id="custom-stop-button" class="button" style="display: block; margin-bottom: 15px">
					Stoper le bot
				</div>
				<div id="custom-autoTarget-button" class="button" style="display: block; margin-bottom: 15px">
					Target Auto
				</div>
				<div id="custom-autoAttack-button" class="button" style="display: block; margin-bottom: 15px">
					Port Attack Auto
				</div>
				<span>Message pour la victime:</span>
				<br>
				<input type="text" class="custom-gui-msg input-form" style="width:250px;height:30px;border:;background:lightgrey;color:black" value="${config.message}" >
				<br><br>
				${freqInput("word")}
				${freqInput("mine")}
				${freqInput("upgrade")}
				${freqInput("hack")}
        <div id="custom-github-button" class="button" style="display: block;">
					Mon YouTube
				</div>
			</div>
		</div>`;
		$(".window-wrapper").append(botWindowHTML);
		$("#custom-autoTarget-button").css("color", config.autoTarget ? "green" : "red");
		$("#custom-autoAttack-button").css("color", config.autoAttack ? "green" : "red");
		$("#custom-gui-bot-title > span.window-close-style").on("click", () => {
			$("#custom-gui").hide();
		});
		$("#custom-restart-button").on("click", () => {
			app.restart();
		});
		$("#custom-stop-button").on("click", () => {
			app.stop();
		});
		$("#custom-autoTarget-button").on("click", () => {
			config.autoTarget = !config.autoTarget;
			$("#custom-autoTarget-button").css("color", config.autoTarget ? "green" : "red");
		});
		$("#custom-autoAttack-button").on("click", () => {
			config.autoAttack = !config.autoAttack;
			$("#custom-autoAttack-button").css("color", config.autoAttack ? "green" : "red");
		});
		$("#custom-github-button").on("click", () => {
			window.open("https://www.youtube.com/channel/UCP_KoCkkTp2gYBDzMa8TDfw");
		});
		$(".custom-gui-freq").on("keypress", (e) => {
			if (e.keyCode !== 13) {
				return;
			}
			const type = $(e.target).attr("data-type");
			if (!config.freq[type]) {
				return;
			}
			config.freq[type] = $(e.target).val();
			log(`* Frequency for '${type}' set to ${config.freq[type]}`);
		});
		$(".custom-gui-msg").on("keypress", (e) => {
			if (e.keyCode !== 13) {
				return;
			}
			config.message = $(e.target).val();
			log(`* message pour la victime set : ${config.message}`);
		});
		const botWindow = ("#custom-gui");
		$(document).on("mousedown", botWindow, (e) => {
			vars.gui.dragReady = true;
			vars.gui.dragOffset.x = e.pageX - $(botWindow).position().left;
			vars.gui.dragOffset.y = e.pageY - $(botWindow).position().top;
		});
		$(document).on("mouseup", botWindow, () => {
			vars.gui.dragReady = false;
		});
		$(document).on("mousemove", (e) => {
			if (vars.gui.dragReady) {
				$(botWindow).css("top", `${e.pageY - vars.gui.dragOffset.y}px`);
				$(botWindow).css("left", `${e.pageX - vars.gui.dragOffset.x}px`);
			}
		});
	}
};
function checkFirewallsUpgrades(FW, index) {
	if (index === 3)
		return true;
	return FW.needUpgrade === false;
}
function parseHackProgress(progress) {
	// remove the %;
	const newProgress = progress.slice(0, -2);
	const newProgressParts = newProgress.split("width: ");
	return parseInt(newProgressParts.pop());
}
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getHashCode(data) {
	let hash = 0;
	if (data.length === 0) {
		return hash;
	}
	for (let i = 0; i < data.length; i++) {
		const c = data.charCodeAt(i);
		hash = ((hash << 5) - hash) + c;
		hash &= hash;
	}
	return hash.toString();
}
function toDataURL(url) {
	return fetch(url)
		.then(response => response.blob())
		.then(blob => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		}));
}
function log(message) {
	console.log(`[hack cheat] ${message}`);
}
