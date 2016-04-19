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
    repo.write('master', url, data, '.', options, function(err) {
        repo_idle = true
        func(err)
    })
}

/*
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
*/


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

var login_name = 'PAPER'
var login_email
var repo = null
var repo_idle = false
var config = {author: login_name, title: login_name, keywords: '', description: '', header: 'PAPER', index_cnt: 10, list: []}
var paper_list = new Array()
var paper_host

$('#username').focus(function() {
    $(this).parent().removeClass('has-error')
    $('#err_login').html('')
})
$('#password').focus(function() {
    $(this).parent().removeClass('has-error')
    $('#err_login').html('')
})
$('#paper_url').focus(function() {
    $(this).parent().removeClass('has-error')
})
$('#paper_title').focus(function() {
    $(this).parent().removeClass('has-error')
})

$('#datetime_picker').datetimepicker({
    format : 'YYYY-MM-DD HH:mm:ss',
    showTodayButton : true,
    showClear : true,
}).on('dp.change', function(ev) {
    var url = $('#paper_url').val()
    var prefix = moment(ev.oldDate).format('YYYY/MM/')
    if (url == '' || url == prefix) {
        $('#paper_url').val(moment(ev.date).format('YYYY/MM/'))
    }
})

$('#upload_file').fileinput({
    'language':'zh',
    'showUpload':false,
})

$('#dialog_login').modal({
    backdrop: 'static',
    show: true,
    keyboard: false
})
$('#login_loading').hide()

var c = document.cookie
if (c && c != '') {
    $('#username').val(c.split('=')[1].split(';')[0])
}

function show_error(id, err) {
    console.log(err)
    $('#' + id).html('<div class="alert alert-danger" role="alert">' + err.error + ' ' + err.request.statusText + '</div>')
}

function edit_paper(i) {
    var path = paper_list[i]
    readfile(path, function(err, data) {
        if (err) {
            return show_error('err_list', err)
        }
        var a = data.indexOf('{')
        var b = data.indexOf('-->')
        if (a >= 0 && b >= 0) {
            var meta = jQuery.parseJSON(data.substring(a, b))
            $('#editor').val(meta.md)
            $('#paper_title').val(meta.title)
            $('#paper_url').val(meta.url)
            $('#paper_keywords').val(meta.keywords)
            $('#paper_description').val(meta.description)
            $('#paper_datetime').val(meta.datetime)
            autosize.update($('textarea'))
        }
        $('#dialog_list').modal('hide')
    })
}

function delete_paper(idx) {
    var path = paper_list[idx]

    $('#paper_' + idx + ' a').removeAttr('href')
    $('#list_loading').show()
    deletefile(path, function(err) {
        if (err) {
            $('#list_loading').hide()
            return show_error('err_list', err)
        }
        $(config.list).each(function(i, v) {
            if (v.url == path) {
                config.list.splice(i, 1)
                update_index(function(err) {
                    $('#list_loading').hide()
                    if (err) {
                        return show_error('err_list', err)
                    }
                    $('#paper_' + idx).remove()
                })
                return
            }
        })
        //remove from archive

    })
}

$('#dialog_preview').on('show.bs.modal',function() {
    preview.html(marked(editor.val()))
})

$('#dialog_publish').on('shown.bs.modal',function() {
    var dt = $('#paper_datetime').val()
    if (dt == '') {
        dt = new Date()
    }
    $('#paper_datetime').val(moment(dt).format('YYYY-MM-DD HH:mm:ss'))
    if ($('#paper_url').val() == '') {
        $('#paper_url').val(moment(dt).format('YYYY/MM/'))
        $('#paper_url').focus()
    }
    $('#err_publish').empty()
    $('#paper_mode').removeAttr('checked')
    $('#publish_loading').hide()
    var data = editor.val()
    if (data != '') {
        data = data.substring(0, data.indexOf('\n'))
        data = data.replace(/^#+|^\s+/, '')
        $('#paper_title').val(data)
    }
})


$('#dialog_upload').on('show.bs.modal',function() {
    $('#upload_prefix').val(moment(new Date()).format('YYYY/MM/'))
    $('#upload_file').fileinput('reset')
    $('#err_upload').empty()
    $('#btn_upload').attr('disabled', 'disabled')
    $('#upload_loading').hide()
})

$('#dialog_setting').on('show.bs.modal',function() {
    $('#err_setting').empty()
})

function append_list(i, path) {
    $('#paper_list').append('<li class="list-group-item" id="paper_' + i + '"><a href="' + paper_host + '/'
                            + path + '" target="_blank">' + path
                            + '</a><p class="pull-right"><a href="javascript:edit_paper(' + i
                            + ')" title="edit">E</a> | <a href="javascript:delete_paper(' + i
                            + ')" title="delete">D</a></p></li>')
}

$('#dialog_list').on('show.bs.modal',function() {
    $('#paper_list').empty()
    $('#err_list').empty()
    $('#paper_list_search').val('')
    $('#list_loading').show()
    paper_list = []
    readdir(function(err, data) {
        $('#list_loading').hide()
        if (err) {
            return show_error('err_list', err)
        }
        var idx = 0
        $(data).each(function(i, v) {
            if (v.type == 'tree') {
                return true
            }
            if (v.path.substr(-5) != '.html') {
                return true
            }
            if (v.path == 'index.html' || v.path == 'archive.html') {
                return true
            }
            paper_list[idx] = v.path
            append_list(idx, v.path)
            idx = idx + 1
        })
    })
})

$('#dialog_help').on('show.bs.modal',function() {
    $.get('README.md', function(data) {
        $('#help').html(marked(data))
    })
})

$('#paper_list_search').keyup(function() {
    var key = $(this).val()
    $('#paper_list').empty()
    var idx = 0
    $(paper_list).each(function(i, v) {
        if (v.toLowerCase().indexOf(key.toLowerCase()) != -1) {
            append_list(idx, v)
            idx = idx + 1
        }
    })
})

$('#btn_login').click(function() {
    var username = $('#username').val()
    var password = $('#password').val()

    var next = true
    if (username == '') {
        next = false
        $('#username').parent().addClass('has-error')
    }
    if (password == '') {
        next = false
        $('#password').parent().addClass('has-error')
    }

    if (next == false) {
        return
    }

    var github = new Github({
        username: username,
        password: password,
        auth: 'basic'
    })

    var f = function(show_setting) {
        $('#index_title').val(html_decode(config.title))
        $('#index_author').val(html_decode(config.author))
        $('#index_keywords').val(html_decode(config.keywords))
        $('#index_description').val(html_decode(config.description))
        $('#index_header').val(config.header)
        $('#index_cnt').val(config.index_cnt)
        $('#index_disqus').val(config.disqus)
        autosize.update($('textarea'))

        $('#login_name').text(login_name).attr('href', paper_host).attr('target', '_blank')
        $('#btn_login').removeAttr('disabled')
        $('#login_loading').hide()
        $('#dialog_login').modal('hide')
        repo_idle = true
        editor.focus()
        if (show_setting) {
            $('#dialog_setting').modal('show')
        }
    }

    $(this).attr('disabled', 'disabled')
    $('#login_loading').show()

    var user = github.getUser()
    user.show(null, function(err, userinfo) {
        if (err != null) {
            $('#btn_login').removeAttr('disabled')
            $('#login_loading').hide()
            $('#username').parent().addClass('has-error')
            $('#password').parent().addClass('has-error')
            return show_error('err_login', err)
        }
        login_name = userinfo.login
        login_email = username
        paper_host = 'http://' + login_name + '.github.io'

        var exp = new Date()
        exp.setFullYear(exp.getFullYear() + 10000)
        document.cookie = '__paper_user=' + username + ';expires=' + exp.toUTCString()

        repo = github.getRepo(login_name, login_name + '.github.io')
        repo.show(function(err, repoinfo) {
            if (err) {
                user.createRepo({'name': login_name + '.github.io'}, function(err, res) {
                    if (err != null) {
                        $('#btn_login').removeAttr('disabled')
                        $('#login_loading').hide()
                        return show_error('err_login', err)
                    }
                    f(true)
                })
            } else {
                repo_idle = true
                readfile('index.html', function(err, data) {
                    var show_setting = true
                    if (err == null) {
                        var a = data.indexOf('{')
                        var b = data.indexOf('-->')
                        if (a >= 0 && b >= 0) {
                            config = jQuery.parseJSON(data.substring(a, b))
                            show_setting = false
                        }
                    }
                    f(show_setting)
                })
            }
        })
    })
})


var upload_data
var upload_encode = true
$('#upload_file').on('fileloaded', function(event, file, previewId, index, reader) {
    var prefix = moment(new Date()).format('YYYY/MM/')
    upload_encode = true
    $('#upload_prefix').val(prefix + file.name)
    if (typeof reader.result === 'string') {
        upload_data = reader.result
        $('#btn_upload').removeAttr('disabled')
    } else {
        var r = new FileReader()
        r.onloadend = function() {
            upload_data = btoa(r.result)
            upload_encode = false
            $('#btn_upload').removeAttr('disabled')
        }
        r.readAsBinaryString(new Blob([reader.result]))
    }
})

$('#upload_file').on('fileclear', function() {
    $('#upload_prefix').val(moment(new Date()).format('YYYY/MM/'))
    $('#err_upload').empty()
    $('#btn_upload').attr('disabled', 'disabled')
})

$('#upload_file').on('filebatchselected', function() {
    $('#err_upload').empty()
})

$('#btn_upload').click(function() {
    $('#err_upload').empty()
    $(this).attr('disabled', 'disabled')
    var upload_path = $('#upload_prefix').val()
    $('#upload_loading').show()
    writefile(upload_path, upload_data, function(err) {
        $('#upload_loading').hide()
        $('#btn_upload').removeAttr('disabled')
        if (err) {
            return show_error('err_upload', err)
        }
        var src = paper_host + '/' + upload_path
        $('#err_upload').html('<a href="' + src + '" target="_blank">' + src + '</a>')
    }, upload_encode)
})

function update_archive(meta, f) {
    var ff = function(data) {
        var item = '<li>' + meta.datetime + ' <a href="'
        + meta.url + '">' + meta.title + '</a></li>'
        data = data.replace(/<ol reversed>/, '<ol reversed>\n' + item)
        writefile('archive.html', data, function(err) {
            f(err)
        })
    }
    readfile('archive.html', function(err, data) {
        if (err) {
            $.get('archive.tpl', function(data) {
                ff(data)
            })
        } else {
            ff(data)
        }
    })
}

function update_index(f) {
    $.get('index.tpl', function(data) {
        var body = ''
        $(config.list).each(function(i, v) {
            body = body + '<a href="' + v.url + '" class="list-group-item">' + v.title + '</a>\n'
        })
        data = data.replace(/{{body}}/, body)
        .replace(/{{title}}/, config.title)
        .replace(/{{author}}/, config.author)
        .replace(/{{keywords}}/, config.keywords)
        .replace(/{{description}}/, config.description)
        .replace(/{{header}}/, config.header)

        data = '<!--' + JSON.stringify(config) + '-->\n' + data

        writefile('index.html', data, function(err) {
            f(err)
        })
    })
}

function create_paper(meta, f) {
    var content = marked(meta.md)
    $.get('paper.tpl', function(data) {
        data = data.replace(/{{body}}/, content)
        .replace(/{{title}}/, meta.title)
        .replace(/{{author}}/, config.author)
        .replace(/{{disqus}}/, config.disqus)
        .replace(/{{keywords}}/, meta.keywords)
        .replace(/{{description}}/, meta.description)
        .replace(/{{datetime}}/, meta.datetime)

        data = '<!--' + JSON.stringify(meta) + '-->\n' + data

        writefile(meta.url, data, function(err) {
            f(err)
        })
    })
}

$('#btn_setting').click(function() {
    config.title = html_encode($('#index_title').val())
    config.author = html_encode($('#index_author').val())
    config.keywords = html_encode($('#index_keywords').val())
    config.description = html_encode($('#index_description').val())
    config.header = $('#index_header').val()
    config.index_cnt = $('#index_cnt').val()
    config.disqus = $('#index_disqus').val()

    $(this).attr('disabled', 'disabled')
    $('#setting_loading').show()
    update_index(function(err) {
        $('#btn_setting').removeAttr('disabled')
        $('#setting_loading').hide()
        if (err) {
            return show_error('err_setting', err)
        }
        $('#dialog_setting').modal('hide')
    })
})

$('#btn_publish').click(function() {
    var meta = {}
    meta.title = html_encode($('#paper_title').val())
    meta.url = $('#paper_url').val()
    meta.keywords = html_encode($('#paper_keywords').val())
    meta.description = html_encode($('#paper_description').val())
    meta.datetime = $('#paper_datetime').val()
    meta.md = editor.val()

    if ($('#paper_mode').is(':checked')) {
        meta.mode = 'draft'
    } else {
        meta.mode = 'publish'
    }

    var prefix = moment(meta.datetime).format('YYYY/MM/')
    if (meta.url == '' || meta.url == prefix) {
        $('#paper_url').parent().addClass('has-error')
        return
    }
    if (meta.title == '') {
        $('#paper_title').parent().addClass('has-error')
        return
    }

    if (meta.url.substr(-5) != '.html') {
        meta.url = meta.url + '.html'
    }


    var reset_publish = function() {
        $('#paper_title').val('')
        $('#paper_url').val('')
        $('#paper_keywords').val('')
        $('#paper_description').val('')
        $('#paper_datetime').val('')
        $('#editor').val('')
        $('#preview').html('')
        $('#dialog_publish').modal('hide')
        autosize.update($('textarea'))
    }


    $(this).attr('disabled', 'disabled')
    $('#publish_loading').show()
    create_paper(meta, function(err) {
        if (err) {
            $('#btn_publish').removeAttr('disabled')
            $('#publish_loading').hide()
            return show_error('err_publish', err)
        }
        if (meta.mode == 'draft') {
            $('#btn_publish').removeAttr('disabled')
            $('#publish_loading').hide()
            reset_publish()
            return
        }
        while (config.list.length >= config.index_cnt) {
            config.list.pop()
        }
        config.list.unshift({url: meta.url, title: meta.title})
        update_index(function(err) {
            if (err) {
                $('#btn_publish').removeAttr('disabled')
                $('#publish_loading').hide()
                return show_error('err_publish', err)
            }
            update_archive(meta, function(err) {
                $('#btn_publish').removeAttr('disabled')
                $('#publish_loading').hide()
                if (err) {
                    return show_error('err_publish', err)
                }
                reset_publish()
            })
        })
    })
})
