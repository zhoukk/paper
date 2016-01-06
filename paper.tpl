<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8">
	<meta http-equiv="Content-Language" content="zh-CN">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="renderer" content="webkit">
	<meta name="generator" content="paper">

	<meta name="author" content="{{author}}">
	<meta name="keywords" content="{{keywords}}">
	<meta name="description" content="{{description}}">

	<title>{{title}}</title>

	<link rel="icon" type="image/x-icon" href="/favicon.ico">
	<link href="//cdn.bootcss.com/bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet">
	<link href="//cdn.bootcss.com/highlight.js/8.9.1/styles/github.min.css" rel="stylesheet">
</head>
<body style="background-color: #eee;">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-body" style="font-size: 18px;">
				{{body}}
			</div>
			<div class="modal-body">
				<hr/>
				<div id="disqus_thread"></div>
			</div>
			<div class="modal-footer">
				<p class="text-center">{{datetime}} | <a href="/">返回主页</a></p>
			</div>
		</div>
	</div>
	<script>
		var disqus_config = function () {
			this.page.url = window.location.href;
			this.page.identifier = window.location.pathname;
		};
		(function() {
			var d = document, s = d.createElement('script');
			s.src = '//{{disqus}}.disqus.com/embed.js';
			s.setAttribute('data-timestamp', +new Date());
			(d.head || d.body).appendChild(s);
		})();
	</script>
	<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
	<script src="//cdn.bootcss.com/highlight.js/8.9.1/highlight.min.js"></script>
	<script type="text/javascript">hljs.initHighlightingOnLoad()</script>
</body>
</html>