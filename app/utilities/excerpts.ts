import { stripHtml } from "./main";

type iExcerpts = {
  html: string;
  opts: {
    characters?: number;
    words?: number;
    append?: string;
  };
};

export const excerpts = (
  html: iExcerpts["html"],
  opts?: iExcerpts["opts"],
): string => {
  html = String(html);
  opts = prepare(opts);

  const text = stripHtml(html);

  let excerpt = "";

  if (opts.characters != null) {
    excerpt = text.slice(0, opts.characters);
  }

  if (opts.words != null) {
    excerpt = text.split(" ").slice(0, opts.words).join(" ");
  }

  if (excerpt.length < text.length) {
    excerpt += opts.append;
  }

  return excerpt;
};

function prepare(opts?: iExcerpts["opts"]) {
  opts = opts || {};

  if (opts.append == null) {
    opts.append = "...";
  }

  if (!opts.words && !opts.characters) {
    opts.words = 50;
  }

  if (opts.words && opts.characters) {
    delete opts.characters;
  }

  if (opts.words != null) {
    opts.words = parseInt(opts.words.toString(), 10);
  }

  if (opts.characters != null) {
    opts.characters = parseInt(opts.characters.toString(), 10);
  }

  return opts;
}
