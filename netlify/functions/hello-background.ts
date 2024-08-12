import type { Context } from "@netlify/functions";

export default (req: Request, context: Context) => {
  console.log("Hello, world!");
  throw new Error("Bye, world!");
  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Hello, world!" }),
  };
};
