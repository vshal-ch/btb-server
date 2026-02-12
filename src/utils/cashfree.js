import { Cashfree, CFEnvironment } from "cashfree-pg";
import AppError from "./AppError.js";

const cashfree = new Cashfree(
  process.env.CF_ENV === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CF_APP_ID,
  process.env.CF_SECRET_KEY,
);

export async function createCFOrder(request) {
  try {
    const response = await cashfree.PGCreateOrder(request);
    // console.log("Cash free order created - ", response);

    return response.data;
  } catch (e) {
    console.log(e);
    
    throw new AppError(
      e.response.data.mesasge || "Cashfree error",
      e.response.statusCode || 500,
    );
  }
}

export default cashfree;
