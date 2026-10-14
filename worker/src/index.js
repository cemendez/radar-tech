const DISPATCH_URL =
    "https://api.github.com/repos/cemendez/radar-tech/actions/workflows/digest.yml/dispatches";

async function dispatch(env) {
    const res = await fetch(DISPATCH_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "radar-tech-trigger",
        },
        body: JSON.stringify({ ref: "main" }),
    });
    if (res.status !== 204) {
        throw new Error(
            `GitHub respondió ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
    }
    console.log("Workflow disparado:", new Date().toISOString());
}

export default {
    async scheduled(controller, env, ctx) {
        ctx.waitUntil(dispatch(env));
    },
};
