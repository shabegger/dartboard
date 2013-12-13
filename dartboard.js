/// <reference path="jquery-1.10.1.js" />

(function (window, $) {

    var numbers = [6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20, 1, 18, 4, 13, 6],
        margin = 2;

    function Dartboard(element) {
        this.canvas = $('<canvas />').get(0);
        this.context = this.canvas.getContext('2d');
        this.element = element;

        this._handlers = [];
        this.attachClickHandler = _attachClickHandler;

        $(element)
            .empty()
            .css({
                'margin': '0',
                'padding': '0',
                'height': '100%',
                'width': '100%',
                'min-height': '200px',
                'min-width': '200px',
                'overflow': 'hidden'
            })
            .append(this.canvas);

        $(window).on('resize', _elementResize.bind(this));
        $(this.canvas).on('click', _click.bind(this));

        _elementResize.call(this);
    }

    function _elementResize() {
        var $canvas = $(this.canvas),
            $element = $(this.element);

        $canvas.attr('width', $element.width());
        $canvas.attr('height', $element.height());

        _createBoard.call(this);
    }

    function _createBoard() {
        var $canvas = $(this.canvas),
            context = this.context,
            width, height,
            x, y, radius,
            tripRadius, singleRadius1, dubRadius, singleRadius2, bullRadius,
            i, len,
            color1, color2,
            fontSize, numberText, textWidth, textHeight, textAngle, textRadius, textX, textY;

        width = $canvas.width();
        height = $canvas.height();

        this._x = x = width / 2;
        this._y = y = height / 2;
        this._radius = radius = (5 / 12) * Math.min(width, height);

        this._dubRadius = dubRadius = 0.85 * radius;
        this._singleRadius1 = singleRadius1 = 0.6 * radius;
        this._tripRadius = tripRadius = 0.45 * radius;
        this._singleRadius2 = singleRadius2 = 0.2 * radius;
        this._bullRadius = bullRadius = 0.1 * radius;

        context.clearRect(0, 0, width, height);

        // Set the font for drawing numbers
        fontSize = (2 / 15) * radius;
        context.font = [fontSize, 'px Segoe UI'].join('');

        // Draw a yellow background for section separators
        context.beginPath();
        context.arc(x, y, radius + margin, 0, 2 * Math.PI);
        context.closePath();
        context.fillStyle = '#ffff00';
        context.fill();

        // Draw the sections and text for each number
        for (i = 0, len = numbers.length; i < len; i++) {
            if (i % 2) {
                color1 = '#000000';
                color2 = '#ff0000';
            } else {
                color1 = '#ff0000';
                color2 = '#000000';
            }

            angle1 = ((0.1 * i) - 0.05) * Math.PI;
            angle2 = ((0.1 * i) + 0.05) * Math.PI;

            _drawSection.call(this, angle1, angle2, radius, dubRadius, color1);
            _drawSection.call(this, angle1, angle2, dubRadius, singleRadius1, color2);
            _drawSection.call(this, angle1, angle2, singleRadius1, tripRadius, color1);
            _drawSection.call(this, angle1, angle2, tripRadius, singleRadius2, color2);

            numberText = numbers[i].toString();

            textWidth = context.measureText(numberText).width;
            textHeight = (3 / 4) * fontSize;
            textAngle = (0.1 * i) * Math.PI;
            textRadius = radius + textHeight;
            textX = (Math.cos(textAngle) * textRadius) - (textWidth / 2) + x;
            textY = (Math.sin(textAngle) * textRadius) + (textHeight / 2) + y;

            context.fillStyle = '#000000';
            context.fillText(numberText, textX, textY);
        }

        // Draw the single bull section
        context.beginPath();
        context.arc(x, y, singleRadius2 - margin, 0, 2 * Math.PI);
        context.arc(x, y, bullRadius + margin, 2 * Math.PI, 0, true);
        context.closePath();
        context.fillStyle = '#ff0000';
        context.fill();

        // Draw the double bull section
        context.beginPath();
        context.arc(x, y, bullRadius - margin, 0, 2 * Math.PI);
        context.closePath();
        context.fillStyle = '#000000';
        context.fill();
    }

    function _drawSection(angle1, angle2, outerRadius, innerRadius, color) {
        var outerPadding = margin / outerRadius,
            innerPadding = margin / innerRadius,
            x = this._x, y = this._y,
            context = this.context;

        context.beginPath();
        context.arc(x, y, outerRadius - margin, angle1 + outerPadding, angle2 - outerPadding);
        context.arc(x, y, innerRadius + margin, angle2 - innerPadding, angle1 + innerPadding, true);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }

    function _click(e) {
        var x = e.offsetX - this._x,
            y = e.offsetY - this._y,
            radius = this._radius,
            hitRadius = Math.sqrt((x * x) + (y * y)),
            tripRadius = this._tripRadius,
            singleRadius1 = this._singleRadius1,
            dubRadius = this._dubRadius,
            singleRadius2 = this._singleRadius2,
            bullRadius = this._bullRadius,
            angle, i, event;

        event = {
            bullseye: false,
            double: false,
            triple: false,
            value: null,
            pointValue: null
        };

        if (hitRadius < bullRadius) {
            // Double Bullseye
            event.bullseye = true;
            event.double = true;
            event.value = 25;
            event.pointValue = 50;
            _fireHandlers.call(this, event);
            return;
        }

        if (hitRadius < singleRadius2) {
            // Bullseye
            event.bullseye = true;
            event.value = 25;
            event.pointValue = 25;
            _fireHandlers.call(this, event);
            return;
        }

        if (x === 0) {
            if (y > 0) {
                angle = 0.5 * Math.PI;
            } else {
                angle = 1.5 * Math.PI;
            }
        } else {
            angle = Math.atan(y / x);
            if (x < 0) {
                angle += Math.PI;
            } else if (y < 0) {
                angle += 2 * Math.PI;
            }
        }

        i = Math.round(10 * (angle / Math.PI));
        event.value = numbers[i];

        if (hitRadius > dubRadius && hitRadius < radius) {
            // Double
            event.double = true;
            event.pointValue = event.value * 2;
        } else if (hitRadius > tripRadius && hitRadius < singleRadius1) {
            // Triple
            event.triple = true;
            event.pointValue = event.value * 3;
        } else if (hitRadius < radius) {
            // Single
            event.pointValue = event.value;
        } else {
            return;
        }

        _fireHandlers.call(this, event);
    }

    function _attachClickHandler(callback) {
        this._handlers.push(callback);
    }

    function _fireHandlers(event) {
        var i, len;

        for (i = 0, len = this._handlers.length; i < len; i++) {
            this._handlers[i].call(this, event);
        }
    }

    window.Dartboard = Dartboard;

})(this, jQuery);