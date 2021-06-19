# Zero Overhead Blog

A really minimal static blog generator that's about the content and the performance. 

### Why

I want to remove all excuses to having a blog. So I built the simplest blog generator I could. Also, I want to code some deno.

### ~JS~ everything fatigue

I hate file bloat in my repo. I get tired just from thinking of dealing with layers of React and Gatsby and `node_modules`. I just want to convert some markdown into simple, performant static page that focuses brutally on the content - both for myself and for users. 

### The accumulated layers of abstraction hinders first steps

Try explaining to a friend who's curious about programming how your frontend setup works. They probably won't listen long enough to get to `package.json`, and by `webpack` you've lost them. 
When I was a kid, programming had much a more immediate positive feedback loop. I changed local HTML, reloaded the browser and saw the effects. I got hooked into it - that made me explore further. This is crucial for having more people join the field - having more inclusive tools for beginners (and minimalists). I want to build tools that bring me back to that feeling of mesmerizing, iterative evolution. "First, do it". Doing the first thing, taking the first step must be simple. 

### zob is free forever

You are welcome to fork it and do whatever you want. 

# How to zob

```sh
$ deno install --allow-write --allow-read --name zob https://raw.githubusercontent.com/firstdoit/zob/master/cli.ts
```

Then, anywhere with a `posts` folder which contains `.md` files with frontmatter containing `{title, date}`:

```md
---
title: Hello, world!
date: '2021-06-12'
---

Hello, world!
```

Run the `build` command:

```sh
$ zob build
```

This generates a `public/` folder with some HTML and CSS files inside.

Publish those anywhere. I use Vercel.

Enjoy!

# Live Preview

While editing posts, you may take a look at the result with the `live` command:

```sh
$ zob live
```

And going to `http://localhost:8080`. Changes to posts are recompiled immediately. 

# Make it yours - customizing zob

When running the first `zob build`, a default `public/index.html` is created. 

Changes made to `public/index.html` will be respected - zob only touches the `<main/>` section in the middle of the document on each build. This means you can open `Developer Tools` in your browser and edit the file in your filesystem.

Posts use `public/index.html` as a template. When the main index is changed, all posts must be recreated. This happens automatically on the next build, or immediately if `zob live` is running.

# How upgrading works

If you want to get the latest version of `zob`, you can run the `upgrade` command.

This will attempt to merge the latest default `index.html` with your changes before and after `<main/>` using `git merge-file`.

# Theming

You can upgrade *into* different *themes* - these are collections of files which will try to be merged into your structure under `public/`. You can use it by adding the `--repo` flag in the format `username/repo` for an arbitrary GitHub repository. (PROTIP: You can also specify a commit or branch like `username/repo#commit`)

```sh
$ zob upgrade --repo firstdoit/zob-simple-blog-theme
```

(This means we store the `index.html` used when first creating your blog in `.zob/firstdoit/zob/{#commit}/index.html` to use it as a common ancestor during diff.)