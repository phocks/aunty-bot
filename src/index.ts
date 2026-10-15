import { SlackApp, SlackEdgeAppEnv, isPostedMessageEvent } from 'slack-cloudflare-workers';

export default {
	async fetch(request: Request, env: SlackEdgeAppEnv, ctx: ExecutionContext): Promise<Response> {
		const app = new SlackApp({ env })
			// When the pattern matches, the framework automatically acknowledges the request
			.event('app_mention', async ({ context }) => {
				// You can do any time-consuming tasks here!
				await context.client.chat.postMessage({
					channel: context.channelId,
					text: `:wave: <@${context.userId}> what's up?`,
					blocks: [
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: `:wave: <@${context.userId}> what's up?`,
							},
							accessory: {
								type: 'button',
								text: { type: 'plain_text', text: 'Click Me' },
								value: 'click_me_123',
								action_id: 'button-action',
							},
						},
						{
							type: 'context',
							elements: [
								{
									type: 'plain_text',
									text: 'This message is posted by an app running on Cloudflare Workers',
								},
							],
						},
					],
				});
			})
			.message('Hello', async ({ context }) => {
				await context.say({ text: 'Hey!' });
			})
			.event('message', async ({ payload }) => {
				if (isPostedMessageEvent(payload)) {
					console.log(`New message: ${payload.text}`);
				}
			})
			.action(
				'button-action',
				async () => {}, // Mus complete this within 3 seconds
				async ({ context }) => {
					// You can do any time-consuming tasks here!
					const { respond } = context;
					if (respond) {
						await respond({ text: 'Now working on it ...' });
						await sleep(5);
						await respond({ text: "It's done :white_check_mark:" });
					}
				},
			)
			.command(
				'/hello-cf-workers',
				async () => 'Thanks!', // Must complete this within 3 seconds
				async ({ context }) => {
					// You can do any time-consuming tasks here!
					await context.respond({ text: "What's up?" });
				},
			)
			.command(
				'/labby',
				async () => 'Thinking…',
				async ({ context, payload }) => {
					await context.respond({ text: `You said: ${payload.text || 'nothing'}` });
				},
			)
			.shortcut(
				'hey-cf-workers',
				async () => {}, // Must complete this within 3 seconds
				async ({ context, payload }) => {
					// You can do any time-consuming tasks here!
					await context.client.views.open({
						// The trigger_id needs to be used within 3 seconds
						trigger_id: payload.trigger_id,
						view: {
							type: 'modal',
							callback_id: 'modal',
							title: { type: 'plain_text', text: 'My App' },
							submit: { type: 'plain_text', text: 'Submit' },
							close: { type: 'plain_text', text: 'Cancel' },
							blocks: [],
						},
					});
				},
			)
			.viewSubmission(
				'modal',
				// Must respond within 3 seconds to update/close the opening modal
				async () => {
					return { response_action: 'clear' };
				},
				async (req) => {
					// Except updating the modal view using response_action,
					// you can asynchronously do any tasks here!
				},
			);
		return await app.run(request, ctx);
	},
};

const sleep = (seconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

// /**
//  * Welcome to Cloudflare Workers!
//  *
//  * This is a template for a Scheduled Worker: a Worker that can run on a
//  * configurable interval:
//  * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
//  *
//  * - Run `npm run dev` in your terminal to start a development server
//  * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
//  * - Run `npm run deploy` to publish your Worker
//  *
//  * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
//  * `Env` object can be regenerated with `npm run cf-typegen`.
//  *
//  * Learn more at https://developers.cloudflare.com/workers/
//  */
//
// export default {
// 	async fetch(req) {
// 		const url = new URL(req.url);
// 		url.pathname = '/__scheduled';
// 		url.searchParams.append('cron', '* * * * *');
// 		return new Response(`To test the scheduled handler ... ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
// 	},
//
// 	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
// 	// [[triggers]] configuration.
// 	async scheduled(event, env, ctx): Promise<void> {
// 		// A Cron Trigger can make requests to other endpoints on the Internet,
// 		// publish to a Queue, query a D1 Database, and much more.
// 		//
// 		// We'll keep it simple and make an API call to a Cloudflare API:
// 		let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
// 		let wasSuccessful = resp.ok ? 'success' : 'fail';
//
// 		// You could store this result in KV, write to a D1 Database, or publish to a Queue.
// 		// In this template, we'll just log the result:
// 		console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
// 	},
// } satisfies ExportedHandler<Env>;
