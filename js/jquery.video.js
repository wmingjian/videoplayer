var VideoPlayer = function() {

var defaults = {
	width: 720,    // Number型，播放器宽度。
	height: 480,   // Number型，播放器高度。
	src: "",       // String型，要播放的视频的 URL。
	poster: "",    // String型，在视频播放之前所显示的图片的 URL。
	loop: false,   // Boolean型，则当媒介文件完成播放后再次开始播放。
	preload: true, // Boolean型，如果出现该属性，则视频在页面加载时进行加载，并预备播放。
	no_support: "您的浏览器不支持html5，无法使用该插件功能！"    // String型，浏览器不支持video标签时的提示，可使用html标签。
};

function VideoPlayer(options) {
	var options = $.extend(defaults, options);
	var _fullScreen = false;
	var _videos = null;
	var _handleResize = null;
	var _resized = false;
	if (!tryCanvas()) {
		alert(options.no_support);
		window.opener = null;
		window.close();
	} else {
		_handleResize = function() {
			var root = document.documentElement;
			if (root.offsetHeight === screen.height) {
				fullScreen();
			} else if (_fullScreen) {
				cancelFullScreen();
			} else {
				resize();
			}
		};
		window.addEventListener("resize", _handleResize);
		_handleFullscreenChange = function(ev) {
			if (!_resized) {
				if (_fullScreen) {
					cancelFullScreen();
				} else {
					fullScreen();
				}
			}
			_resized = false;
		};
		document.addEventListener("fullscreenchange", _handleFullscreenChange);
		document.addEventListener("mozfullscreenchange", _handleFullscreenChange);
		document.addEventListener("webkitfullscreenchange", _handleFullscreenChange);
		document.addEventListener("msfullscreenchange", _handleFullscreenChange);
		return this.each(function() {
			init($(this), options);
			resize();
		});
	}
	// 播放器初始化
	function init(container, options) {
		var tpl = '<video src="' + options.src + '" width="' + options.width + '" height="' + options.height + '" poster="' + options.poster + '">'
			+   '<source src="' + options.src + '" type="video/ogg" />'
			+   '<source src="' + options.src + '" type="video/mp4" />'
			+   options.no_support
			+ '</video>'
			+ '<div class="video_body">'
			+   '<div class="video_controls">'
			+     '<ul class="video_controls_l">'
			+       '<li class="v_play">'
			+         '<i class="iconfont play" title="播放">&#462;</i>'
			+         '<i class="iconfont play" title="暂停" style="display:none;">&#419;</i>'
			+         '<b>时长：<em>0:00</em> / <em>0:00</em></b>'
			+       '</li>'
			+       '<li class="v_items">'
			+         '<i class="iconfont addurl" title="播放新视频">&#410;</i>'
			+         '<i class="iconfont volume" title="音量调节">&#33;</i>'
			+         '<p class="v_volume">'
			+           '<progress  max="100" value="100" class="v_progress"></progress>'
			+           '<input type="range" class="v_range other_range" value="100" min="0" max="100">'
			+         '</p>'
			+         '<mark class="volume_percentage">100%</mark>'
			+       '</li>'
			+     '</ul>'
			+     '<div class="video_controls_r">'
			+       '<i class="iconfont fullscreen" title="全屏">&#476;</i>'
			+       '<i class="iconfont fullscreen" title="退出全屏" style="display:none;">&#472;</i>'
			+     '</div>'
			+   '</div>'
			+   '<div class="video_range">'
			+     '<progress max="0" value="0" class="v_progress"></progress>'
			+     '<input type="range" class="v_range" value="0" min="0" max="0">'
			+   '</div>'
			+   '<div class="v_bigplaybtn"><i class="iconfont">&#462;</i></div>'
			+   '<em class="video_tipinfo"></em>'
			+   '<div class="video_window" hidden="true">'
			+     '<h2>播放视频：</h2>'
			+     '<i>&times;</i>'
			+     '<div class="vw_content">'
			+       '<p>您可以输入后缀名为<i>mp4/ogg/mov</i>等的网络视频点击播放（如：http://oss.aliyuncs.com/zihanblog/file/HTML5%E6%A6%82%E8%BF%B0.mp4），或选择本地视频。</p>'
			+       '<form class="video_urlform">'
			+         '<input type="url" size="30" list="videolist" class="video_urlinput" name="video_urlinput" placeholder="请输入视频地址" required="true" pattern="^.*?\.(mp4|egg|mov)$">'
			+         '<input type="submit" class="video_playbtn" value="播放">'
			+         '<input type="button" class="video_choosebtn" value="本地视频">'
			+         '<input type="file" accept="video/*" class="video_file" hidden="true">'
			+       '</form>'
			+     '</div>'
			+   '</div>'
			+   '<div class="video_mask"><i class="iconfont" style="display:none;">&#120;</i></div>'
			+ '</div>';
		container.html(tpl);
		_videos = container.find("video");
		var video = _videos[0];
		if (options.loop) {
			_videos.attr("loop", "loop");
		}
		if (options.preload) {
			_videos.attr("preload", "preload");
		}

		// 样式初始化
		container.css({width: options.width, height: options.height}).show();
		$(".video_body").css({width: options.width, height: options.height});
		$(".video_controls_l").width($(".video_body").width() - 150);
		$(".videocontainer").css({width: options.width, height: options.height}).show();
		$(".video_controls_l").width($(".video_body").width() - 150);

		// tiptip
		$(".video_controls i, .v_share a").tipTip({defaultPosition: "top"});

		// 进度滑块
		$(".v_range").on("change", function(e) {
			$(this).prev(".v_progress").val($(this).val());
		});

		// 播放进度
		$(".video_range .v_range").on("change", function(e) {
			video.currentTime = $(this).val();
		});
		// 音量
		$(".v_volume .v_range").on("change", function(e) {
			$(".volume_percentage").text($(this).val() + "%");
			video.volume = Number($(this).val()) / 100;
		});
		// Play按钮
		$(".iconfont.play").on("click", function(e) {
			$(this).hide().siblings(".play").show();
			if (video.paused) {
				$(".v_bigplaybtn").hide();
				video.play();
			} else {
				$(".v_bigplaybtn").show();
				video.pause();
			}
		});

		// video事件绑定
		_videos.on({
			"loadedmetadata": function() {
				var _t1 = video.duration; // 视频总时间
				var _t2 = Math.floor(_t1 / 60) + ":" + Math.floor(_t1 - Math.floor(_t1 / 60) * 60);
				$(".v_play b em:eq(1)").html(_t2);
				$(".video_range .v_progress, .video_range .v_range").attr("max", Math.floor(_t1));
			},
			"timeupdate": function() {
				var _t1 = video.currentTime; // 当前播放时间
				var _t2 = Math.floor(_t1 / 60) + ":" + Math.floor(_t1 - Math.floor(_t1 / 60) * 60);
				$(".v_play b em:eq(0)").html(_t2);
				$(".video_range .v_progress, .video_range .v_range").attr("value", Math.floor(_t1));
			},
			"waiting": function() {
				tipInfo("视频地址不正确或者网速不给力");
				$(".v_status").html("视频正在等待中……");
			},
			"canplay": function() {
				tipInfo("视频可以播放，请点击播放按钮。");
				$(".v_status").html("视频加载完成");
			},
			"playing": function() { // 真正处于播放的状态，这个时候我们才是真正的在观看视频
				tipInfo("视频正在播放");
				$(".v_status").html("视频正在播放");
				$(".v_playstatus b:eq(0)").addClass("active").siblings("b").removeClass("active");
			},
			"canplaythrough": function() {
				tipInfo("视频以当前速率，无需缓存即可播放");
			},
			"ended": function() { // 播放完毕
				tipInfo("视频播放完毕");
				$(".v_status").html("视频播放完毕");
				$(".iconfont.play:visible").hide().siblings(".play").show();
				$(".v_bigplaybtn").show();
				$(".v_playstatus b:eq(2)").addClass("active").siblings("b").removeClass("active");
				$(".video_controls").animate({"bottom": 0}, 500);
				$(".video_range").animate({"bottom": 42}, 500);
			},
			"play": function() {
				// 播放器不在保持“暂停”状态，即“play()”方法被调用或者autoplay属性设置为true期望播放器自动开始播放。
				// hideContainer();
			},
			"durationchange": function() { // duration(视频播放总时长)属性被更新
				tipInfo("视频长度已发生变化");
			},
			"pause": function() {
				tipInfo("视频已暂停");
				$(".v_status").html("视频已暂停");
				$(".v_playstatus b:eq(1)").addClass("active").siblings("b").removeClass("active");
				showContainer();
			}
		});

		// 下载视频
		$(".iconfont.save").on("click", function() {
			window.open(_videos.attr("src"));
		});

		// 播放按钮Big
		$(".v_bigplaybtn").on("click", function() {
			$(".iconfont.play:visible").click();
			$(this).fadeOut(100);
		});

		// 播放新视频
		$(".iconfont.addurl").on("click", function() {
			$(".video_window").show().animate({zoom: 1}, 100);
			$("i.addurl").addClass("active");
		});
		$(".video_window>i").on("click", function() {
			$(".video_window").fadeOut(200).css("zoom", .01);
			$("i.addurl").removeClass("active");
		});

		// 本地视频
		$(".video_choosebtn").on("click", function() {
			$(this).next(".video_file").click();
		});

		$(".video_file").on("change", function() {
			// _videos.attr("src", $(this).val());
			alert("呵呵，开个玩笑~");
			$(".video_window>i").click();
		});

		// 全屏按钮
		$(".iconfont.fullscreen").on("click", function() {
			toggleFullScreen(this, _videos);
		});

		// 播放速率
		$(".v_bitrate .v_range").on("change", function(e) {
			video.playbackRate = $(this).val() / 2;
			if (video.playbackRate == 0) {
				$(".c_bitrate em").text("0倍");
			}
			if (video.playbackRate == 0.5) {
				$(".c_bitrate em").text("0.5倍");
			}
			if (video.playbackRate == 1) {
				$(".c_bitrate em").text("1倍");
			}
			if (video.playbackRate == 1.5) {
				$(".c_bitrate em").text("1.5倍");
			}
			if (video.playbackRate == 2) {
				$(".c_bitrate em").text("2倍");
			}
		});

		// 分享
		$(".v_share a").on("click", function() {
			share(this, "http://www.zi-han.net/", "Html5视频播放器插件");
			return false;
		});

		// 右键菜单
		$(".video_body").bind("contextmenu", function(e) {
			return false;
		});

		// 播放新视频
		$(".video_playbtn").on("click", function() {
			if (/^.*?\.(mp4|egg|mov)$/.test($(".video_urlinput").val())) {
				_videos.attr("src", $(".video_urlinput").val());
				$(".video_window>i").click();
				return false;
			}
		});
		var videoMenuData = [
			[
				{text: "播放/暂停", func: function() {$(".iconfont.play:visible").click();}},
				{text: "视频地址", func: function() {tipInfo("视频地址：" + _videos.attr("src"));}}
			],
			[
				{text: "打开新视频", func: function() {$(".iconfont.addurl").click();}}/*,
				{text: "保存视频", func: function() {$(".iconfont.save").click();}}*/
			],
			[
				{text: "全屏/正常", func: function() {$(".iconfont.fullscreen:visible").click();}}/*,
				{text: "设置选项", func: function() {$(".iconfont.setting").click();}}*/
			]/*,
			[
				{
					text: "其他信息",
					data: [
						[
							{text: "关于作者", func: function() {
								tipInfo("请查看作者博客：<a href='http://www.zi-han.net/' target='_blank'>http://www.zi-han.net/</a>");
							}},
							{text: "插件文档", func: function() {
								window.open("http://www.zi-han.net/");
								tipInfo("<a href='javascript:alert(\"文档整理中，请稍后...\");' target='_blank'>打开文档页面</a>");
							}},
							{text: "下载源代码", func: function() {
								window.open("http://oss.aliyuncs.com/zihanblog/file/html5video.zip");
								tipInfo("如果下载窗口没有弹出，请手动下载。<a href='http://oss.aliyuncs.com/zihanblog/file/html5video.zip' target='_blank'>下载源代码</a>" );
							}}
						]
					]
				}
			]*/
		];
		$(".video_mask")
			.on("dbclick", function() {
				$(".iconfont.fullscreen:visible").click();
			})
			.click(function() {
				$(".iconfont.play:visible").click();
			})
			.smartMenu(videoMenuData, {name: "videoMenu"});
		tipInfo("视频地址：" + _videos.attr("src"));
	}
	function dispose() {
		document.removeEventListener("fullscreenchange", _handleFullscreenChange);
		document.removeEventListener("mozfullscreenchange", _handleFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", _handleFullscreenChange);
		document.removeEventListener("msfullscreenchange", _handleFullscreenChange);
		window.removeEventListener("resize", _handleResize);
	}
	function resize() {
		var force = window.top !== window;
		var root = document.documentElement;
		var css, w, h;
		if (_fullScreen) {
				w = root.offsetWidth;
				h = root.offsetHeight; // (window.screen.width, window.screen.height)
			css = {
				width: w,
				height: h,
				position: "absolute",
				top: 0,
				left: 0,
				margin: 0
			};
		} else {
			if (force) {
				w = root.offsetWidth;
				h = root.offsetHeight;
			} else {
				w = options.width;
				h = options.height;
			}
			css = {
				width: w,
				height: h,
				position: "relative",
				top: -h,
				left: 0
			};
		}
		$(".video_body").css(css);
		css.top = 0;
		_videos.css(css);
		$(".video_controls_l").width($(".video_body").width() - 150);
		$(".iconfont.fullscreen").hide();
		$(".iconfont.fullscreen").eq(_fullScreen ? 1 : 0).show();
		_resized = true;
	}
	function fullScreen() {
		_fullScreen = true;
		resize();
		tipInfo("已经入全屏模式");
	}
	function cancelFullScreen() {
		_fullScreen = false;
		resize();
		tipInfo("已退出全屏模式");
	}
	function toggleFullScreen(el) {
		if (!_fullScreen) {
			var root = document.documentElement;
			if (root.requestFullscreen)
				root.requestFullscreen();
			else if (root.mozRequestFullScreen)
				root.mozRequestFullScreen();
			else if (root.webkitRequestFullScreen)
				root.webkitRequestFullScreen();
		} else {
			if (document.exitFullscreen)
				document.exitFullscreen();
			else if (document.mozCancelFullScreen)
				document.mozCancelFullScreen();
			else if (document.webkitCancelFullScreen)
				document.webkitCancelFullScreen();
		}
	}
	// 判断浏览器是否支持html5
	function tryCanvas() {
		var canvas = document.createElement("canvas");
		if (canvas) {
			return canvas.getContext;
		}
	}
	// 提示信息
	function tipInfo(msg) {
		$(".video_tipinfo").css("top", -25).show().html(msg).animate({top: 0}, 500);
		setTimeout(function() {
			$(".video_tipinfo").fadeOut(800);
		}, 5000);
	}
	// 显示控制栏
	function showContainer() {
		$(".video_controls").animate({"bottom": 0}, 500);
		$(".video_range").animate({"bottom": 42}, 500);
	}
	// 隐藏控制栏
	function hideContainer() {
		setTimeout(function() {
			$(".video_controls").animate({"bottom": -40}, 500);
			$(".video_range").animate({"bottom": -2}, 500);
			$(".iconfont.setting").removeClass("active");
		}, 7000);
	}
}

	return VideoPlayer;
}();

(function($) {
	$.fn.extend({
		html5video: VideoPlayer
	});
})(jQuery);
