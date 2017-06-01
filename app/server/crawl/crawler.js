let jsdom = require("jsdom");
const { JSDOM } = jsdom;
let request = require('request');

let Crawl = function(protocol, host, hostnameReg, startingUrl, maxReqs = 1, cutoff = -1) {

	let reqQueue = [],
			parrallelQueueObj = {},
			inProg = {},
			processed = {};

	function cleanHref(href) {
		return href.replace(/^\./, '');
	}

	function processHyperLink(HyperLinkObj) {
		return new Promise((resolve, reject) => {
			const hostname = HyperLinkObj.hostname,
						href = HyperLinkObj.href,
						finalHref = `${protocol}${host}${cleanHref(href)}`;

			// console.log(new Date(), parrallelQueueObj, processed, inProg, `${finalHref} Is it being processed, already in queue, or done? ${!(parrallelQueueObj[finalHref] == undefined && processed[finalHref] == undefined && inProg[finalHref] == undefined)}`);
			if((hostname.match(hostnameReg) || hostname == null || hostname == '') && parrallelQueueObj[finalHref] == undefined && processed[finalHref] == undefined && inProg[finalHref] == undefined) {
				addToQueue(finalHref);
				// console.log(new Date(), `ADDED ${finalHref}`);
			}

			resolve();
		});
	}

	async function processResults(results) {
		// console.log(results.error, results.response);
		const dom = new JSDOM(results.body),
					links = dom.window.document.querySelectorAll('a');

		if(links.length > 0)
		{
			for(let value of links.values()) {
				// console.log(new Date(), `Working on ${results.response.request.path}`);
				await processHyperLink(value);
				// console.log(new Date(), `Finished ${results.response.request.path}`);
			}
		}
	}

	async function processResultsAndWait(results) {
		await processResults(results);

		let result = {error: false, url: results.url};

		if(results.error != undefined) {
			result.error = true;
			result.errorInfo = {
				message: results.error.message
			}
		}

		if(results.response != undefined) {
			result.responseInfo = {
				statusCode: results.response.statusCode,
				statusMessage: results.response.statusMessage
			};
		}

		return result;
	}

	function sendRequest(url) {
		inProg[url] = url;

		return new Promise((resolve, reject) => {
			request(url, (error, response, body) => {
				let results = processResultsAndWait({url: url, error: error, response: response, body: body});
				resolve(results);
			});
		});
	}

	async function awaitSendRequest() {
		const url = popQueue();
		processed[url] = await sendRequest(url);
		delete inProg[url];
	}

	function addToQueue(url) {
		reqQueue.unshift(url);
		parrallelQueueObj[url] = true;
	}

	function popQueue() {
		let url = reqQueue.pop();
		delete parrallelQueueObj[url];
		return url;
	}

	function processQueue() {
		// console.log(new Date(), `Processing Queue, what's in it? ${reqQueue}`);
		// console.log(Object.keys(inProg).length < maxReqs, Object.keys(processed).length < cutoff);
		if(Object.keys(inProg).length < maxReqs && (Object.keys(processed).length < cutoff || cutoff < 0)) {
			awaitSendRequest().then(() => {
				processQueue();
			}).catch((data) => {
				console.log(new Date(), "SOMETHING BAD HAPPENED", data);
				console.log("Results before failure", processed);
				console.log("Inprogress", inProg);
			});
		} else if (reqQueue.length == 0 || Object.keys(processed).length >= cutoff) {
			console.log(new Date(), `Finished! processed ${Object.keys(processed).length} pages.`);

			Object.keys(processed).forEach((key) => {
				console.log(new Date(), processed[key]);
			});
		}

		//Do nothing, we've maxed out our reqs
	}

	function init() {
		addToQueue(startingUrl);
		processQueue();
	}

	init();
};

Crawl('https://', 'mvicente.com', /mvicente.com/, 'https://mvicente.com/');

// module.exports = {
// 	Module: Crawl
// };
