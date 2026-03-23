import migrations from "@convex-dev/migrations/convex.config";
import resend from "@convex-dev/resend/convex.config";
import seshat from "@nativesquare/seshat/convex.config.js";
import soma from "@nativesquare/soma/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(migrations);
app.use(resend);
app.use(seshat);
app.use(soma);

export default app;
