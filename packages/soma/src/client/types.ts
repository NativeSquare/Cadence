import type {
    GenericActionCtx,
    GenericMutationCtx,
    GenericQueryCtx,
    GenericDataModel,
} from "convex/server";

export type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;

export type MutationCtx = Pick<
    GenericMutationCtx<GenericDataModel>,
    "runQuery" | "runMutation"
>;

export type ActionCtx = Pick<
    GenericActionCtx<GenericDataModel>,
    "runQuery" | "runMutation" | "runAction"
>;
