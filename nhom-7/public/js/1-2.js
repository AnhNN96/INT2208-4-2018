var matched = false;

mainEvent1();

function mainEvent1() {
    checkWindowSize();
    // add events

    // check if user available
    $('#submit-login').submit(function (event) {
        if (!matched) {
            event.preventDefault();
            var userName = $(this).find('#username')[0].value;
            for (var i = 0; i < userdata.length; i++) {
                if (userName === userdata[i].email) {
                    $(this).find('#username')[0].value = userdata[i].username;
                }
            }
        }
        matched = true;
    });

    // remove container in window when it's smaller than 992px
    $(window).resize(function () {
        if ($(this).width() < 992) {
            $(".duy-cover").removeClass("container");
        } else $(".duy-cover").addClass("container")
    });

    // chage active carousel
    $("#first-carousel").children()[0].classList.add("active", "scroll");
    $("#second-carousel").children()[0].classList.add("active", "scroll");
    $(".carousel").carousel({
        interval: 200000
    });
}

function checkWindowSize() {
    if ($(this).width() < 992) {
        $(".duy-cover").removeClass("container");
    } else $(".duy-cover").addClass("container")
}