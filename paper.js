hljs.initHighlightingOnLoad();
autosize($('textarea'));
var editor = $('#editor')
var preview = $('#preview')

function html_encode(v) {
    return $('<div/>').text(v).html()
}

function html_decode(v) {
    return $('<div/>').html(v).text()
}
/*
function readfile(url, func) {
    if (!repo_idle) return
    repo_idle = false
    repo.read('master', url, function(err, data) {
        repo_idle = true
        func(err, data)
    })
}

function writefile(url, data, func, encode) {
    var options = {
        author: {
            name: login_name,
            email: login_email
        },
        committer: {
            name: login_name,
            email: login_email
        },
        encode: encode
    }
    if (!repo_idle) return
    repo_idle = false
    repo.write('master', url, data, ".", options, function(err) {
        repo_idle = true
        func(err)
    })
}
*/

function readfile(url, func) {
    $.ajax({
        url: '/build/' + url,
        type: 'GET',
        success: function(data) {
            func(null, data)
        },
        error: function(err) {
            func(err, null)
        }
    })
}

function writefile(url, data, func, encode) {
    $.post('/build/' + url, {data:data}, function(rdata) {
        func(null, rdata)
    })
}

function deletefile(url, func) {
    if (!repo_idle) return
    repo_idle = false
    repo.remove('master', url, function(err) {
        repo_idle = true
        func(err)
    })
}

function readdir(func) {
    if (!repo_idle) return
    repo_idle = false
    repo.getTree('master?recursive=true', function(err, tree) {
        repo_idle = true
        func(err, tree)
    })
}

var login_name = "PAPER"
var login_email
var repo = null
var repo_idle = false
var config = {author: login_name, title: login_name, keywords: "", description: "", header: "PAPER"}
var paper_list = new Array()
var paper_host

var f = function() {
    $(this).parent().removeClass('has-error')
}
$("#username").focus(f)
$("#password").focus(f)
$("#paper_title").focus(f)

$('#datetime_picker').datetimepicker({
    format : "YYYY-MM-DD HH:mm:ss",
    showTodayButton : true,
    showClear : true,
})

$("#upload_file").fileinput({
    'language':'zh',
    'showUpload':false,
})
/*
$('#dialog_login').modal({
    backdrop: 'static',
    show: true,
    keyboard: false
})
*/

var c = document.cookie
if (c && c != "") {
    $("#username").val(c.split("=")[1].split(";")[0])
}

function show_error(id, err) {
    console.log(err)
    $("#" + id).html('<div class="alert alert-danger" role="alert">' + err.error + ' ' + err.request.statusText + '</div>')
}

function edit_paper(path) {
    readfile(path+".meta", function(err, data) {
        if (err) {
            return show_error("err_list", err)
        }
        var meta = jQuery.parseJSON(data)
        $("#editor").val(meta.md)
        $("#paper_title").val(meta.title)
        $("#paper_keywords").val(meta.keywords)
        $("#paper_description").val(meta.description)
        autosize.update($('textarea'))

        $("#dialog_list").modal('hide')
    })
}

function delete_paper(i, path) {
    $("#paper_" + i + " a").removeAttr("href")
    deletefile(path + ".html", function(err1) {
        deletefile(path + ".meta", function(err2) {
            update_index(function(err3) {
                if (err1) {
                    return show_error("err_list", err1)
                }
                if (err2) {
                    return show_error("err_list", err2)
                }
                if (err3) {
                    return show_error("err_list", err3)
                }
                $("#paper_"+i).remove()
            })
        })
    })
}

$('#dialog_preview').on('show.bs.modal',function() {
    preview.html(marked(editor.val()))
})

$('#dialog_publish').on('show.bs.modal',function() {
    $('#paper_datetime').val(moment(new Date()).format("YYYY-MM-DD HH:mm:ss"))
    $('#err_publish').empty()
    $('#paper_mode').removeAttr('checked')
})

$('#dialog_upload').on('show.bs.modal',function() {
    var d = new Date()
    $("#upload_prefix").val(d.getFullYear() + '/' + (d.getMonth()+1) + '/')
    $("#upload_file").fileinput('reset')
    $("#err_upload").empty()
    $("#btn_upload").attr("disabled", "disabled")
})

$('#dialog_setting').on('show.bs.modal',function() {
    $('#err_setting').empty()
})

function append_list(i, name, path) {
    $("#paper_list").append('<li class="list-group-item" id="paper_' + i + '"><a href="' + paper_host + "/"
        + path + '.html" target="_blank">' + name
        + '</a><p class="pull-right"><a href="javascript:edit_paper(\'' + path
        + '\')" title="edit">E</a> | <a href="javascript:delete_paper(' + i
        + ', \'' + path + '\')" title="delete">D</a></p></li>')
}

$('#dialog_list').on('show.bs.modal',function() {
    $("#paper_list").empty()
    $("#err_list").empty()
    $("#paper_list_search").val('')
    paper_list = []
    readdir(function(err, data) {
        if (err) {
            return show_error("err_list", err)
        }
        $(data).each(function(i, v) {
            if (v.type == 'tree') {
                return true
            }
            if (v.path.substr(-5) != ".meta") {
                return true
            }
            var path = v.path.substr(0, v.path.length - 5)
            var name = path.substring(path.lastIndexOf('/') + 1)
            append_list(i, name, path)
            paper_list.push({path: path, name: name})
        })
    })
})

$('#dialog_help').on('show.bs.modal',function() {
    $.get('README.md', function(data) {
        $('#help').html(marked(data))
    })
})

$("#paper_list_search").keyup(function() {
    var key = $(this).val()
    $("#paper_list").empty()
    $(paper_list).each(function(i, v) {
        if (v.name.toLowerCase().indexOf(key.toLowerCase()) != -1) {
            append_list(i, v.name, v.path)
        }
    })
})

$("#btn_login").click(function() {
    var username = $("#username").val()
    var password = $("#password").val()

    var next = true
    if (username == "") {
        next = false
        $("#username").parent().addClass("has-error")
    }
    if (password == "") {
        next = false
        $("#password").parent().addClass("has-error")
    }

    if (next == false) {
        return
    }

    var github = new Github({
        username: username,
        password: password,
        auth: "basic"
    })

    var f = function(show_setting) {
        $("#index_title").val(html_decode(config.title))
        $("#index_author").val(html_decode(config.author))
        $("#index_keywords").val(html_decode(config.keywords))
        $("#index_description").val(html_decode(config.description))
        $("#index_header").val(config.header)
        $("#index_disqus").val(config.disqus)
        autosize.update($('textarea'))

        $("#login_name").text(login_name).attr("href", paper_host).attr("target", "_blank")
        $("#btn_login").removeAttr("disabled")
        $('#dialog_login').modal('hide')
        repo_idle = true
        editor.focus()
        if (show_setting) {
            $("#dialog_setting").modal('show')
        }
    }

    $(this).attr("disabled", "disabled")

    var user = github.getUser()
    user.show(null, function(err, userinfo) {
        if (err != null) {
            $("#btn_login").removeAttr("disabled")
            return show_error("err_login", err)
        }
        login_name = userinfo.login
        login_email = username
        paper_host = "http://" + login_name + ".github.io"

        var exp = new Date()
        exp.setFullYear(exp.getFullYear() + 10000)
        document.cookie = "__paper_user=" + username + ";expires=" + exp.toUTCString()

        repo = github.getRepo(login_name, login_name + ".github.io")
        repo.show(function(err, repoinfo) {
            if (err) {
                user.createRepo({"name": login_name + ".github.io"}, function(err, res) {
                    if (err != null) {
                        $("#btn_login").removeAttr("disabled")
                        return show_error("err_login", err)
                    }
                    f(true)
                })
            } else {
                repo_idle = true
                readfile('paper.json', function(err, data) {
                    var show_setting = true
                    if (err == null) {
                        config = jQuery.parseJSON(data)
                        show_setting = false
                    }
                    f(show_setting)
                })
            }
        })
    })
})


function create_archive(data, item) {
    data = data.replace(/<ol>/, '<ol>\n'+item)
    writefile('archive.html', data, function(err) {
        console.log("write ok")
    })
}

function update_index(f, item) {
    readfile('archive.html', function(err, data) {
        if (err) {
            $.get('/archive.html', function(data) {
                create_archive(data, item)
            })
        } else {
            create_archive(data, item)
        }
    })

    $.get('index.tpl', function(data) {
        f()
        var body = ""
/*
        readdir(function(err, list) {
            if (err != null) {
                return f(err)
            }
            var array = new Array()
            var ef = function() {
                array.sort(function(a, b) {
                    var da = moment(a.datetime).toDate()
                    var db = moment(b.datetime).toDate()
                    return da < db ? 1 : -1
                })
                $(array).each(function(i, v) {
                    body = body + '<a href="/' + v.path + '.html" class="list-group-item">' + v.title + '</a>\n'
                })
                data = data.replace(/{{body}}/, body)
                    .replace(/{{title}}/, config.title)
                    .replace(/{{author}}/, config.author)
                    .replace(/{{keywords}}/, config.keywords)
                    .replace(/{{description}}/, config.description)
                    .replace(/{{header}}/, config.header)
                writefile('index.html', data, function(err) {
                    if (err) {
                        return f(err)
                    }
                })
            }
        })
 */   })
}

$("#btn_setting").click(function() {
    config.title = html_encode($("#index_title").val())
    config.author = html_encode($("#index_author").val())
    config.keywords = html_encode($("#index_keywords").val())
    config.description = html_encode($("#index_description").val())
    config.header = $("#index_header").val()
    config.disqus = $("#index_disqus").val()

    $(this).attr("disabled", "disabled")
    writefile('paper.json', JSON.stringify(config), function(err) {
        $("#btn_setting").removeAttr("disabled")
        if (err) {
            return show_error("err_setting", err)
        }
        $("#dialog_setting").modal('hide')
    })
})

var upload_data
var upload_encode = true
$("#upload_file").on('fileloaded', function(event, file, previewId, index, reader) {
    var d = new Date()
    var prefix = d.getFullYear() + '/' + (d.getMonth()+1) + '/'
    upload_encode = true
    $("#upload_prefix").val(prefix + file.name)
    if (typeof reader.result === "string") {
        upload_data = reader.result
        $("#btn_upload").removeAttr("disabled")
    } else {
        var r = new FileReader()
        r.onloadend = function() {
            upload_data = btoa(r.result)
            upload_encode = false
            $("#btn_upload").removeAttr("disabled")
        }
        r.readAsBinaryString(new Blob([reader.result]))
    }
})

$("#upload_file").on('fileclear', function() {
    var d = new Date()
    $("#upload_prefix").val(d.getFullYear() + '/' + (d.getMonth()+1) + '/')
    $("#err_upload").empty()
    $("#btn_upload").attr("disabled", "disabled")
})

$("#upload_file").on('filebatchselected', function() {
    $("#err_upload").empty()
})

$("#btn_upload").click(function() {
    $("#err_upload").empty()
    $(this).attr("disabled", "disabled")
    var upload_path = $("#upload_prefix").val()
    writefile(upload_path, upload_data, function(err) {
        $("#btn_upload").removeAttr("disabled")
        if (err) {
            return show_error("err_upload", err)
        }
        var src = paper_host + "/" + upload_path
        $("#err_upload").html('<a href="' + src + '" target="_blank">' + src + '</a>')
    }, upload_encode)
})

$("#btn_publish").click(function() {
    var meta = {}
    meta.title = html_encode($("#paper_title").val())
    meta.keywords = html_encode($("#paper_keywords").val())
    meta.description = html_encode($("#paper_description").val())
    meta.datetime = $("#paper_datetime").val()
    meta.md = editor.val()

    if ($("#paper_mode").is(':checked')) {
        meta.mode = 'draft'
    } else {
        meta.mode = 'publish'
    }

    if (meta.title == "") {
        $("#paper_title").parent().addClass("has-error")
        return
    }
    var content = marked(meta.md)

    var d = moment(meta.datetime).toDate()
    var prefix = d.getFullYear() + '/' + (d.getMonth()+1)
    meta.path = prefix + '/' + meta.title

    $(this).attr("disabled", "disabled")
    $.get('paper.tpl', function(data) {
        data = data.replace(/{{body}}/, content)
        .replace(/{{title}}/, meta.title)
        .replace(/{{author}}/, config.author)
        .replace(/{{disqus}}/, config.disqus)
        .replace(/{{keywords}}/, meta.keywords)
        .replace(/{{description}}/, meta.description)
        .replace(/{{datetime}}/, meta.datetime)

        data = "<!--\n" + JSON.stringify(meta) + "\n-->\n" + data

        writefile(meta.path + ".html", data, function(err) {
            if (err) {
                return show_error("err_write", err)
            }
            update_index(function(err) {
                $("#btn_publish").removeAttr("disabled")
                if (err) {
                    return show_error("err_publish", err)
                }
                $("#paper_title").val('')
                $("#paper_keywords").val('')
                $("#paper_description").val('')
                $("#editor").val('')
                $('#preview').html('')
                $('#dialog_publish').modal('hide')
                autosize.update($('textarea'))
            }, '<li>' + meta.datetime + ' <a href="/' + meta.path + '.html">' + meta.title + '</a></li>')
        })
    })
})
