import agent from "@convex-dev/agent/convex.config";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config.js";
import migrations from "@convex-dev/migrations/convex.config";
import resend from "@convex-dev/resend/convex.config";
import agoge from "@nativesquare/agoge/convex.config.js";
import seshat from "@nativesquare/seshat/convex.config.js";
import soma from "@nativesquare/soma/convex.config.js";
import { defineApp } from "convex/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const app: any = defineApp();
app.use(agent);
app.use(migrations);
app.use(pushNotifications);
app.use(resend);
app.use(agoge);
app.use(seshat);
app.use(soma);

export default app;
