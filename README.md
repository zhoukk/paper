# PAPER帮助

PAPER是一款基于github pages的博客写作发布工具，支持markdown语法格式，使用简单，完全在线操作。


## 登录

PAPER使用了[github.js](https://github.com/michael/github)开源库在线操作github repository，github.js封装了[github api](https://developer.github.com/v3/)。所以PAPER使用github帐号登录系统。



## 设置

第一次登录PAPER,系统会检查github帐号下是否存在 用户名.github.io repository（github pages 默认存放静态博客资源的库），若不存在则创建此库，然后弹出设置对话框。设置选项有：

* 简介 - 一段简述文字用于显示在博客主页
* 标题 - 博客的标题，显示在主页的<title></title>
* 作者 - 博客的作者信息，显示在主页的http头部<meta name="author" content="">
* 关键字 - 博客的搜索关键字信息，显示在主页的http头部<meta name="keywords" content="">
* 描述 - 博客的描述文字，显示在主页的http头部<meta name="description" content="">
* 评论 - 博客评论功能使用disqus的帐号名

点击设置，会把设置数据按json格式存储到库目录下的paper.json文件中。

## 编写

在输入框中以markdown语法编写博客正文内容，使用github markdown样式，并支持github中的代码highlight高亮。输入框高度随内容多少而变化。

## 预览

点击菜单条上的预览按钮可以生成预览对话框，显示预览效果。

## 发布

点击菜单条上的发布按钮，弹出发布对话框。输入文章的标题，关键字，描述，发布时间等数据即可发布文章到github pages库中。还可以设置发布为暂存草稿。系统会在库目录下按日期生成目录（类似 2016/1/）并在目录中以json格式生成 标题.meta 文件存储文章元数据，生成 标题.html 文章的页面。根据文章列表生成博客主页index.html，系统还会在库目录下生成rss.xml 和 atom.xml 文件。


## 列表

点击菜单条上的列表按钮，弹出文章列表对话框，列出当前博客的所有文章。可以按标题搜索列表，对列表中的文章做编辑 和 删除操作。


## 上传

点击菜单条上的上传按钮，弹出上传对话框，可以上传文件（例如图片等）到库的指定目录中。

## 浏览

点击菜单条上右侧超链接打开博客主页面。

