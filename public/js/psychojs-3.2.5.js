var util = (function (exports) {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _newArrowCheck(innerThis, boundThis) {
    if (innerThis !== boundThis) {
      throw new TypeError("Cannot instantiate an arrow function");
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  /**
   * Clock component.
   *
   * @author Alain Pitiot
   * @version 3.2.5
   * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
   * @license Distributed under the terms of the MIT License
   */
  var MonotonicClock =
  function () {
    function MonotonicClock() {
      var startTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : MonotonicClock.getReferenceTime();
      _classCallCheck(this, MonotonicClock);
      this._timeAtLastReset = startTime;
    }
    _createClass(MonotonicClock, [{
      key: "getTime",
      value: function getTime() {
        return MonotonicClock.getReferenceTime() - this._timeAtLastReset;
      }
    }, {
      key: "getLastResetTime",
      value: function getLastResetTime() {
        return this._timeAtLastReset;
      }
    }], [{
      key: "getReferenceTime",
      value: function getReferenceTime() {
        return new Date().getTime() / 1000.0 - MonotonicClock._referenceTime;
      }
    }, {
      key: "getDateStr",
      value: function getDateStr() {
        var format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'YYYY-MM-DD_HH[h]mm.ss.SSS';
        return moment().format(format);
      }
    }]);
    return MonotonicClock;
  }();
  MonotonicClock._referenceTime = new Date().getTime() / 1000.0;
  var Clock =
  function (_MonotonicClock) {
    _inherits(Clock, _MonotonicClock);
    function Clock() {
      _classCallCheck(this, Clock);
      return _possibleConstructorReturn(this, _getPrototypeOf(Clock).call(this));
    }
    _createClass(Clock, [{
      key: "reset",
      value: function reset() {
        var newTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
      }
    }, {
      key: "add",
      value: function add(deltaTime) {
        this._timeAtLastReset += deltaTime;
      }
    }]);
    return Clock;
  }(MonotonicClock);
  var CountdownTimer =
  function (_Clock) {
    _inherits(CountdownTimer, _Clock);
    function CountdownTimer() {
      var _this;
      var startTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      _classCallCheck(this, CountdownTimer);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(CountdownTimer).call(this));
      _this._timeAtLastReset = MonotonicClock.getReferenceTime();
      _this._countdown_duration = startTime;
      if (startTime) {
        _this.add(startTime);
      }
      return _this;
    }
    _createClass(CountdownTimer, [{
      key: "add",
      value: function add(deltaTime) {
        this._timeAtLastReset += deltaTime;
      }
    }, {
      key: "reset",
      value: function reset() {
        var newTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
        if (typeof newTime == 'undefined') {
          this._timeAtLastReset = MonotonicClock.getReferenceTime() + this._countdown_duration;
        } else {
          this._countdown_duration = t;
          this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
        }
      }
    }, {
      key: "getTime",
      value: function getTime() {
        return this._timeAtLastReset - MonotonicClock.getReferenceTime();
      }
    }]);
    return CountdownTimer;
  }(Clock);

  /**
   * Color management.
   *
   * @author Alain Pitiot
   * @version 3.2.5
   * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
   * @license Distributed under the terms of the MIT License
   */
  var Color =
  function () {
    function Color() {
      var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'black';
      var colorspace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Color.COLOR_SPACE.RGB;
      _classCallCheck(this, Color);
      var response = {
        origin: 'Color',
        context: 'when defining a color'
      };
      if (typeof obj == 'string') {
        if (colorspace !== Color.COLOR_SPACE.RGB) throw Object.assign(response, {
          error: 'the colorspace must be RGB for' + ' a' + ' named color'
        });
        if (obj[0] === '#') {
          this._hex = obj;
        }
        else {
            if (!(obj.toLowerCase() in Color.NAMED_COLORS)) throw Object.assign(response, {
              error: 'unknown named color: ' + obj
            });
            this._hex = Color.NAMED_COLORS[obj.toLowerCase()];
          }
        this._rgb = Color.hexToRgb(this._hex);
      }
      else if (typeof obj == 'number') {
          if (colorspace !== Color.COLOR_SPACE.RGB) throw Object.assign(response, {
            error: 'the colorspace must be RGB for' + ' a' + ' named color'
          });
          this._rgb = Color._intToRgb(obj);
        }
        else if (Array.isArray(obj)) {
            Color._checkTypeAndRange(obj);
            var _obj = _slicedToArray(obj, 3),
                a = _obj[0],
                b = _obj[1],
                c = _obj[2];
            if (colorspace !== Color.COLOR_SPACE.RGB255) {
              Color._checkTypeAndRange(obj, [-1, 1]);
              a = (a + 1.0) / 2.0;
              b = (b + 1.0) / 2.0;
              c = (c + 1.0) / 2.0;
            }
            switch (colorspace) {
              case Color.COLOR_SPACE.RGB255:
                Color._checkTypeAndRange(obj, [0, 255]);
                this._rgb = [a / 255.0, b / 255.0, c / 255.0];
                break;
              case Color.COLOR_SPACE.RGB:
                this._rgb = [a, b, c];
                break;
              case Color.COLOR_SPACE.HSV:
                break;
              case Color.COLOR_SPACE.DKL:
                break;
              case Color.COLOR_SPACE.LMS:
                break;
              default:
                throw Object.assign(response, {
                  error: 'unknown colorspace: ' + colorspace
                });
            }
          }
    }
    _createClass(Color, [{
      key: "toString",
      value: function toString() {
        return this.hex;
      }
    }, {
      key: "rgb",
      get: function get() {
        return this._rgb;
      }
    }, {
      key: "rgb255",
      get: function get() {
        return [Math.round(this._rgb[0] * 255.0), Math.round(this._rgb[1] * 255.0), Math.round(this._rgb[2] * 255.0)];
      }
    }, {
      key: "hex",
      get: function get() {
        if (typeof this._hex === 'undefined') this._hex = Color._rgbToHex(this._rgb);
        return this._hex;
      }
    }, {
      key: "int",
      get: function get() {
        if (typeof this._int === 'undefined') this._int = Color._rgbToInt(this._rgb);
        return this._int;
      }
    }], [{
      key: "hexToRgb255",
      value: function hexToRgb255(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result == null) throw {
          origin: 'Color.hexToRgb255',
          context: 'when converting an hexadecimal color code to its 255- or [0,1]-based RGB color representation',
          error: 'unable to parse the argument: wrong type or wrong code'
        };
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
      }
    }, {
      key: "hexToRgb",
      value: function hexToRgb(hex) {
        var _Color$hexToRgb = Color.hexToRgb255(hex),
            _Color$hexToRgb2 = _slicedToArray(_Color$hexToRgb, 3),
            r255 = _Color$hexToRgb2[0],
            g255 = _Color$hexToRgb2[1],
            b255 = _Color$hexToRgb2[2];
        return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
      }
    }, {
      key: "rgb255ToHex",
      value: function rgb255ToHex(rgb255) {
        var response = {
          origin: 'Color.rgb255ToHex',
          context: 'when converting an rgb triplet to its hexadecimal color representation'
        };
        try {
          Color._checkTypeAndRange(rgb255, [0, 255]);
          return Color._rgb255ToHex(rgb255);
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "rgbToHex",
      value: function rgbToHex(rgb) {
        var response = {
          origin: 'Color.rgbToHex',
          context: 'when converting an rgb triplet to its hexadecimal color representation'
        };
        try {
          Color._checkTypeAndRange(rgb, [0, 1]);
          return Color._rgbToHex(rgb);
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "rgbToInt",
      value: function rgbToInt(rgb) {
        var response = {
          origin: 'Color.rgbToInt',
          context: 'when converting an rgb triplet to its integer representation'
        };
        try {
          Color._checkTypeAndRange(rgb, [0, 1]);
          return Color._rgbToInt(rgb);
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "rgb255ToInt",
      value: function rgb255ToInt(rgb255) {
        var response = {
          origin: 'Color.rgb255ToInt',
          context: 'when converting an rgb triplet to its integer representation'
        };
        try {
          Color._checkTypeAndRange(rgb255, [0, 255]);
          return Color._rgb255ToInt(rgb255);
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "_rgb255ToHex",
      value: function _rgb255ToHex(rgb255) {
        return "#" + ((1 << 24) + (rgb255[0] << 16) + (rgb255[1] << 8) + rgb255[2]).toString(16).slice(1);
      }
    }, {
      key: "_rgbToHex",
      value: function _rgbToHex(rgb) {
        var rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
        return Color._rgb255ToHex(rgb255);
      }
    }, {
      key: "_rgbToInt",
      value: function _rgbToInt(rgb) {
        var rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
        return Color._rgb255ToInt(rgb255);
      }
    }, {
      key: "_rgb255ToInt",
      value: function _rgb255ToInt(rgb255) {
        return rgb255[0] * 0x10000 + rgb255[1] * 0x100 + rgb255[2];
      }
    }, {
      key: "_intToRgb255",
      value: function _intToRgb255(hex) {
        var r255 = hex >>> 0x10;
        var g255 = (hex & 0xFF00) / 0x100;
        var b255 = hex & 0xFF;
        return [r255, g255, b255];
      }
    }, {
      key: "_intToRgb",
      value: function _intToRgb(hex) {
        var _Color$_intToRgb = Color._intToRgb255(hex),
            _Color$_intToRgb2 = _slicedToArray(_Color$_intToRgb, 3),
            r255 = _Color$_intToRgb2[0],
            g255 = _Color$_intToRgb2[1],
            b255 = _Color$_intToRgb2[2];
        return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
      }
    }, {
      key: "_checkTypeAndRange",
      value: function _checkTypeAndRange(arg) {
        var range = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        if (!Array.isArray(arg) || arg.length !== 3 || typeof arg[0] !== 'number' || typeof arg[1] !== 'number' || typeof arg[2] !== 'number') {
          throw 'the argument should be an array of numbers of length 3';
        }
        if (typeof range !== 'undefined' && (arg[0] < range[0] || arg[0] > range[1] || arg[1] < range[0] || arg[1] > range[1] || arg[2] < range[0] || arg[2] > range[1])) throw 'the color components should all belong to [' + range[0] + ', ' + range[1] + ']';
      }
    }]);
    return Color;
  }();
  Color.COLOR_SPACE = {
    RGB: Symbol["for"]('RGB'),
    RGB255: Symbol["for"]('RGB255')
  };
  Color.NAMED_COLORS = {
    'aliceblue': '#F0F8FF',
    'antiquewhite': '#FAEBD7',
    'aqua': '#00FFFF',
    'aquamarine': '#7FFFD4',
    'azure': '#F0FFFF',
    'beige': '#F5F5DC',
    'bisque': '#FFE4C4',
    'black': '#000000',
    'blanchedalmond': '#FFEBCD',
    'blue': '#0000FF',
    'blueviolet': '#8A2BE2',
    'brown': '#A52A2A',
    'burlywood': '#DEB887',
    'cadetblue': '#5F9EA0',
    'chartreuse': '#7FFF00',
    'chocolate': '#D2691E',
    'coral': '#FF7F50',
    'cornflowerblue': '#6495ED',
    'cornsilk': '#FFF8DC',
    'crimson': '#DC143C',
    'cyan': '#00FFFF',
    'darkblue': '#00008B',
    'darkcyan': '#008B8B',
    'darkgoldenrod': '#B8860B',
    'darkgray': '#A9A9A9',
    'darkgreen': '#006400',
    'darkkhaki': '#BDB76B',
    'darkmagenta': '#8B008B',
    'darkolivegreen': '#556B2F',
    'darkorange': '#FF8C00',
    'darkorchid': '#9932CC',
    'darkred': '#8B0000',
    'darksalmon': '#E9967A',
    'darkseagreen': '#8FBC8B',
    'darkslateblue': '#483D8B',
    'darkslategray': '#2F4F4F',
    'darkturquoise': '#00CED1',
    'darkviolet': '#9400D3',
    'deeppink': '#FF1493',
    'deepskyblue': '#00BFFF',
    'dimgray': '#696969',
    'dodgerblue': '#1E90FF',
    'firebrick': '#B22222',
    'floralwhite': '#FFFAF0',
    'forestgreen': '#228B22',
    'fuchsia': '#FF00FF',
    'gainsboro': '#DCDCDC',
    'ghostwhite': '#F8F8FF',
    'gold': '#FFD700',
    'goldenrod': '#DAA520',
    'gray': '#808080',
    'green': '#008000',
    'greenyellow': '#ADFF2F',
    'honeydew': '#F0FFF0',
    'hotpink': '#FF69B4',
    'indianred': '#CD5C5C',
    'indigo': '#4B0082',
    'ivory': '#FFFFF0',
    'khaki': '#F0E68C',
    'lavender': '#E6E6FA',
    'lavenderblush': '#FFF0F5',
    'lawngreen': '#7CFC00',
    'lemonchiffon': '#FFFACD',
    'lightblue': '#ADD8E6',
    'lightcoral': '#F08080',
    'lightcyan': '#E0FFFF',
    'lightgoldenrodyellow': '#FAFAD2',
    'lightgray': '#D3D3D3',
    'lightgreen': '#90EE90',
    'lightpink': '#FFB6C1',
    'lightsalmon': '#FFA07A',
    'lightseagreen': '#20B2AA',
    'lightskyblue': '#87CEFA',
    'lightslategray': '#778899',
    'lightsteelblue': '#B0C4DE',
    'lightyellow': '#FFFFE0',
    'lime': '#00FF00',
    'limegreen': '#32CD32',
    'linen': '#FAF0E6',
    'magenta': '#FF00FF',
    'maroon': '#800000',
    'mediumaquamarine': '#66CDAA',
    'mediumblue': '#0000CD',
    'mediumorchid': '#BA55D3',
    'mediumpurple': '#9370DB',
    'mediumseagreen': '#3CB371',
    'mediumslateblue': '#7B68EE',
    'mediumspringgreen': '#00FA9A',
    'mediumturquoise': '#48D1CC',
    'mediumvioletred': '#C71585',
    'midnightblue': '#191970',
    'mintcream': '#F5FFFA',
    'mistyrose': '#FFE4E1',
    'moccasin': '#FFE4B5',
    'navajowhite': '#FFDEAD',
    'navy': '#000080',
    'oldlace': '#FDF5E6',
    'olive': '#808000',
    'olivedrab': '#6B8E23',
    'orange': '#FFA500',
    'orangered': '#FF4500',
    'orchid': '#DA70D6',
    'palegoldenrod': '#EEE8AA',
    'palegreen': '#98FB98',
    'paleturquoise': '#AFEEEE',
    'palevioletred': '#DB7093',
    'papayawhip': '#FFEFD5',
    'peachpuff': '#FFDAB9',
    'peru': '#CD853F',
    'pink': '#FFC0CB',
    'plum': '#DDA0DD',
    'powderblue': '#B0E0E6',
    'purple': '#800080',
    'red': '#FF0000',
    'rosybrown': '#BC8F8F',
    'royalblue': '#4169E1',
    'saddlebrown': '#8B4513',
    'salmon': '#FA8072',
    'sandybrown': '#F4A460',
    'seagreen': '#2E8B57',
    'seashell': '#FFF5EE',
    'sienna': '#A0522D',
    'silver': '#C0C0C0',
    'skyblue': '#87CEEB',
    'slateblue': '#6A5ACD',
    'slategray': '#708090',
    'snow': '#FFFAFA',
    'springgreen': '#00FF7F',
    'steelblue': '#4682B4',
    'tan': '#D2B48C',
    'teal': '#008080',
    'thistle': '#D8BFD8',
    'tomato': '#FF6347',
    'turquoise': '#40E0D0',
    'violet': '#EE82EE',
    'wheat': '#F5DEB3',
    'white': '#FFFFFF',
    'whitesmoke': '#F5F5F5',
    'yellow': '#FFFF00',
    'yellowgreen': '#9ACD32'
  };

  var _this = undefined;
  var ColorMixin = function ColorMixin(superclass) {
    _newArrowCheck(this, _this);
    return (
      function (_superclass) {
        _inherits(_class, _superclass);
        function _class(args) {
          _classCallCheck(this, _class);
          return _possibleConstructorReturn(this, _getPrototypeOf(_class).call(this, args));
        }
        _createClass(_class, [{
          key: "setColor",
          value: function setColor(color, log) {
            this._setAttribute('color', color, log);
            this._needUpdate = true;
          }
        }, {
          key: "setContrast",
          value: function setContrast(contrast, log) {
            this._setAttribute('contrast', contrast, log);
            this._needUpdate = true;
          }
        }, {
          key: "getContrastedColor",
          value: function getContrastedColor(color, contrast) {
            var _this2 = this;
            var rgb = color.rgb.map(function (c) {
              _newArrowCheck(this, _this2);
              return (c * 2.0 - 1.0) * contrast;
            }.bind(this));
            return new Color(rgb, Color.COLOR_SPACE.RGB);
          }
        }]);
        return _class;
      }(superclass)
    );
  }.bind(undefined);

  var _this$1 = undefined;
  /**
   * Various utilities.
   *
   * @author Alain Pitiot
   * @version 3.2.5
   * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
   * @license Distributed under the terms of the MIT License
   */
  var mix = function mix(superclass) {
    _newArrowCheck(this, _this$1);
    return new MixinBuilder(superclass);
  }.bind(undefined);
  var MixinBuilder =
  function () {
    function MixinBuilder(superclass) {
      _classCallCheck(this, MixinBuilder);
      this.superclass = superclass;
    }
    _createClass(MixinBuilder, [{
      key: "with",
      value: function _with() {
        var _this2 = this;
        for (var _len = arguments.length, mixins = new Array(_len), _key = 0; _key < _len; _key++) {
          mixins[_key] = arguments[_key];
        }
        return mixins.reduce(function (c, mixin) {
          _newArrowCheck(this, _this2);
          return mixin(c);
        }.bind(this), this.superclass);
      }
    }]);
    return MixinBuilder;
  }();
  function promiseToTupple(promise) {
    var _this3 = this;
    return promise.then(function (data) {
      _newArrowCheck(this, _this3);
      return [null, data];
    }.bind(this))["catch"](function (error) {
      _newArrowCheck(this, _this3);
      return [error, null];
    }.bind(this));
  }
  function makeUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }
  function getErrorStack() {
    try {
      throw Error('');
    } catch (error) {
      var stack = error.stack.split("\n");
      stack.splice(1, 1);
      return JSON.stringify(stack.join('\n'));
    }
  }
  function isEmpty(x) {
    if (typeof x === 'undefined') return true;
    if (!Array.isArray(x)) return false;
    if (x.length === 0) return true;
    if (x.length === 1 && typeof x[0] === 'undefined') return true;
    return false;
  }
  function detectBrowser() {
    var isOpera = !!window.opr && !!opr.addons || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    if (isOpera) return 'Opera';
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if (isFirefox) return 'Firefox';
    var isSafari = /constructor/i.test(window.HTMLElement) || function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    }(!window['safari'] || typeof safari !== 'undefined' && safari.pushNotification);
    if (isSafari) return 'Safari';
    var isIE =
     !!document.documentMode;
    if (isIE) return 'IE';
    var isEdge = !isIE && !!window.StyleMedia;
    if (isEdge) return 'Edge';
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    if (isChrome) return 'Chrome';
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    if (isBlink) return 'Blink';
    return 'unknown';
  }
  function toNumerical(obj) {
    var _this4 = this;
    var response = {
      origin: 'util.toNumerical',
      context: 'when converting an object to its numerical form'
    };
    if (typeof obj === 'number') return obj;
    if (typeof obj === 'string') obj = [obj];
    if (Array.isArray(obj)) {
      return obj.map(function (e) {
        _newArrowCheck(this, _this4);
        var n = Number.parseFloat(e);
        if (Number.isNaN(n)) Object.assign(response, {
          error: 'unable to convert: ' + e + ' to a' + ' number.'
        });
        return n;
      }.bind(this));
    }
  }
  function IsPointInsidePolygon(point, vertices) {
    var x = point[0];
    var y = point[1];
    var isInside = false;
    for (var i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      var xi = vertices[i][0],
          yi = vertices[i][1];
      var xj = vertices[j][0],
          yj = vertices[j][1];
      var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }
  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var _ref = [array[j], array[i]];
      array[i] = _ref[0];
      array[j] = _ref[1];
    }
    return array;
  }
  function getPositionFromObject(object, units) {
    var response = {
      origin: 'util.getPositionFromObject',
      context: 'when getting the position of an object'
    };
    try {
      if (typeof object === 'undefined') throw 'cannot get the position of an undefined object';
      var objectWin = undefined;
      if (typeof object.getPos === 'function') {
        units = object.units;
        objectWin = object.win;
        object = object.getPos();
      }
      return to_px(object, units, objectWin);
    } catch (error) {
      throw Object.assign(response, {
        error: error
      });
    }
  }
  function to_px(pos, posUnit, win) {
    var response = {
      origin: 'util.to_px',
      context: 'when converting a position to pixel units'
    };
    if (posUnit === 'pix') return pos;else if (posUnit === 'norm') return [pos[0] * win.size[0] / 2.0, pos[1] * win.size[1] / 2.0];else if (posUnit === 'height') {
      var minSize = Math.min(win.size[0], win.size[1]);
      return [pos[0] * minSize, pos[1] * minSize];
    } else throw Object.assign(response, {
      error: "unknown position units: ".concat(posUnit)
    });
  }
  function to_norm(pos, posUnit, win) {
    var response = {
      origin: 'util.to_norm',
      context: 'when converting a position to norm units'
    };
    if (posUnit === 'norm') return pos;
    if (posUnit === 'pix') return [pos[0] / (win.size[0] / 2.0), pos[1] / (win.size[1] / 2.0)];
    if (posUnit === 'height') {
      var minSize = Math.min(win.size[0], win.size[1]);
      return [pos[0] * minSize / (win.size[0] / 2.0), pos[1] * minSize / (win.size[1] / 2.0)];
    }
    throw Object.assign(response, {
      error: "unknown position units: ".concat(posUnit)
    });
  }
  function to_height(pos, posUnit, win) {
    var response = {
      origin: 'util.to_height',
      context: 'when converting a position to height units'
    };
    if (posUnit === 'height') return pos;
    if (posUnit === 'pix') {
      var minSize = Math.min(win.size[0], win.size[1]);
      return [pos[0] / minSize, pos[1] / minSize];
    }
    if (posUnit === 'norm') {
      var _minSize = Math.min(win.size[0], win.size[1]);
      return [pos[0] * win.size[0] / 2.0 / _minSize, pos[1] * win.size[1] / 2.0 / _minSize];
    }
    throw Object.assign(response, {
      error: "unknown position units: ".concat(posUnit)
    });
  }
  function to_win(pos, posUnit, win) {
    var response = {
      origin: 'util.to_win',
      context: 'when converting a position to window units'
    };
    try {
      if (win._units === 'pix') return to_px(pos, posUnit, win);
      if (win._units === 'norm') return to_norm(pos, posUnit, win);
      if (win._units === 'height') return to_height(pos, posUnit, win);
      throw "unknown window units: ".concat(win._units);
    } catch (error) {
      throw Object.assign(response, {
        response: response,
        error: error
      });
    }
  }
  function to_unit(pos, posUnit, win, targetUnit) {
    var response = {
      origin: 'util.to_unit',
      context: 'when converting a position to different units'
    };
    try {
      if (targetUnit === 'pix') return to_px(pos, posUnit, win);
      if (targetUnit === 'norm') return to_norm(pos, posUnit, win);
      if (targetUnit === 'height') return to_height(pos, posUnit, win);
      throw "unknown target units: ".concat(targetUnit);
    } catch (error) {
      throw Object.assign(response, {
        error: error
      });
    }
  }
  function to_pixiPoint(pos, posUnit, win) {
    var pos_px = to_px(pos, posUnit, win);
    return new PIXI.Point(pos_px[0], pos_px[1]);
  }
  function toString(object) {
    var _this5 = this;
    if (typeof object === 'undefined') return 'undefined';
    if (!object) return 'null';
    if (typeof object === 'string') return object;
    if (object.constructor.toString().substring(0, 5) === 'class' && typeof object.toString === 'function') return object.toString();
    try {
      var symbolReplacer = function symbolReplacer(key, value) {
        _newArrowCheck(this, _this5);
        if (_typeof(value) === 'symbol') value = Symbol.keyFor(value);
        return value;
      }.bind(this);
      return JSON.stringify(object, symbolReplacer);
    } catch (e) {
      return 'Object (circular)';
    }
  }
  if (!String.prototype.format) {
    String.prototype.format = function () {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
      }).replace(/{([$_a-zA-Z][$_a-zA-Z0-9]*)}/g, function (match, name) {
        return args.length > 0 && args[0][name] !== undefined ? args[0][name] : match;
      });
    };
  }
  function getRequestError(jqXHR, textStatus, errorThrown) {
    var errorMsg = 'unknown error';
    if (typeof jqXHR.responseJSON !== 'undefined') errorMsg = jqXHR.responseJSON;else if (typeof jqXHR.responseText !== 'undefined') errorMsg = jqXHR.responseText;else if (typeof errorThrown !== 'undefined') errorMsg = errorThrown;
    return errorMsg;
  }
  function isInt(obj) {
    if (isNaN(obj)) return false;
    var x = parseFloat(obj);
    return (x | 0) === x;
  }
  function getUrlParameters() {
    var urlQuery = window.location.search.slice(1);
    return new URLSearchParams(urlQuery);
  }
  function addInfoFromUrl(info) {
    var _this6 = this;
    var infoFromUrl = getUrlParameters();
    infoFromUrl.forEach(function (key, value) {
      _newArrowCheck(this, _this6);
      if (key.indexOf('__') !== 0) info[key] = value;
    }.bind(this));
    return info;
  }
  function selectFromArray(array, selection) {
    var _this7 = this;
    if (isInt(selection)) return array[parseInt(selection)];
    else if (Array.isArray(selection)) return array.filter(function (e, i) {
        _newArrowCheck(this, _this7);
        return selection.includes(i);
      }.bind(this));
      else if (typeof selection === 'string') {
          if (selection.indexOf(',') > -1) return selection.split(',').map(function (a) {
            _newArrowCheck(this, _this7);
            return selectFromArray(array, a);
          }.bind(this));
          else if (selection.indexOf(':') > -1) {
              var sliceParams = selection.split(':').map(function (a) {
                _newArrowCheck(this, _this7);
                return parseInt(a);
              }.bind(this));
              if (sliceParams.length === 3) return sliceArray(array, sliceParams[0], sliceParams[2], sliceParams[1]);else return sliceArray.apply(void 0, [array].concat(_toConsumableArray(sliceParams)));
            }
        } else throw {
          origin: 'selectFromArray',
          context: 'when selecting entries from an array',
          error: 'unknown selection type: ' + _typeof(selection)
        };
  }
  function flattenArray(array) {
    var _this8 = this;
    return array.reduce(function (flat, next) {
      _newArrowCheck(this, _this8);
      flat.push(Array.isArray(next) && Array.isArray(next[0]) ? flattenArray(next) : next);
      return flat;
    }.bind(this), []);
  }
  function sliceArray(array) {
    var _this9 = this;
    var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : NaN;
    var to = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : NaN;
    var step = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : NaN;
    if (isNaN(from)) from = 0;
    if (isNaN(to)) to = array.length;
    var arraySlice = array.slice(from, to);
    if (isNaN(step)) return arraySlice;
    if (step < 0) arraySlice.reverse();
    step = Math.abs(step);
    if (step == 1) return arraySlice;else return arraySlice.filter(function (e, i) {
      _newArrowCheck(this, _this9);
      return i % step == 0;
    }.bind(this));
  }
  function offerDataForDownload(filename, data, type) {
    var blob = new Blob([data], {
      type: type
    });
    if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveBlob(blob, filename);else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  var EventEmitter =
  function () {
    function EventEmitter() {
      _classCallCheck(this, EventEmitter);
      this._listeners = new Map();
      this._onceUuids = new Map();
    }
    _createClass(EventEmitter, [{
      key: "on",
      value: function on(name, listener) {
        if (typeof listener !== 'function') throw new TypeError('listener must be a function');
        var uuid = makeUuid();
        if (!this._listeners.has(name)) this._listeners.set(name, []);
        this._listeners.get(name).push({
          uuid: uuid,
          listener: listener
        });
        return uuid;
      }
    }, {
      key: "once",
      value: function once(name, listener) {
        var uuid = this.on(name, listener);
        if (!this._onceUuids.has(name)) this._onceUuids.set(name, []);
        this._onceUuids.get(name).push(uuid);
        return uuid;
      }
    }, {
      key: "off",
      value: function off(name, uuid) {
        var _this = this;
        var relevantUuidListeners = this._listeners.get(name);
        if (relevantUuidListeners && relevantUuidListeners.length) {
          this._listeners.set(name, relevantUuidListeners.filter(function (uuidlistener) {
            _newArrowCheck(this, _this);
            return uuidlistener.uuid != uuid;
          }.bind(this)));
          return true;
        }
        return false;
      }
    }, {
      key: "emit",
      value: function emit(name, data) {
        var _this2 = this;
        var relevantUuidListeners = this._listeners.get(name);
        if (relevantUuidListeners && relevantUuidListeners.length) {
          var onceUuids = this._onceUuids.get(name);
          var self = this;
          relevantUuidListeners.forEach(function (_ref) {
            var uuid = _ref.uuid,
                listener = _ref.listener;
            _newArrowCheck(this, _this2);
            listener(data);
            if (typeof onceUuids !== 'undefined' && onceUuids.includes(uuid)) self.off(name, uuid);
          }.bind(this));
          return true;
        }
        return false;
      }
    }]);
    return EventEmitter;
  }();

  var PsychObject =
  function (_EventEmitter) {
    _inherits(PsychObject, _EventEmitter);
    function PsychObject(psychoJS, name) {
      var _this;
      _classCallCheck(this, PsychObject);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(PsychObject).call(this));
      _this._psychoJS = psychoJS;
      _this._userAttributes = new Set();
      if (typeof name === 'undefined') name = _this.constructor.name;
      _this._addAttribute('name', name);
      return _this;
    }
    _createClass(PsychObject, [{
      key: "toString",
      value: function toString$1() {
        var representation = this.constructor.name + '( ';
        var addComma = false;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = this._userAttributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var attribute = _step.value;
            if (addComma) representation += ', ';
            addComma = true;
            var value = toString(this['_' + attribute]);
            var l = value.length;
            if (l > 50) {
              if (value[l - 1] === ')') value = value.substring(0, 50) + '~)';else value = value.substring(0, 50) + '~';
            }
            representation += attribute + '=' + value;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
        representation += ' )';
        return representation;
      }
    }, {
      key: "_setAttribute",
      value: function _setAttribute(attributeName, attributeValue) {
        var _this2 = this;
        var log = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var operation = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
        var stealth = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
        var response = {
          origin: 'PsychObject.setAttribute',
          context: 'when setting the attribute of an object'
        };
        if (typeof attributeName == 'undefined') throw Object.assign(response, {
          error: 'the attribute name cannot be' + ' undefined'
        });
        if (typeof attributeValue == 'undefined') {
          this._psychoJS.logger.warn('setting the value of attribute: ' + attributeName + ' in PsychObject: ' + this._name + ' as: undefined');
        }
        if (typeof operation !== 'undefined' && this.hasOwnProperty('_' + attributeName)) {
          var oldValue = this['_' + attributeName];
          if (typeof attributeValue == 'number' || Array.isArray(attributeValue) && (attributeValue.length === 0 || typeof attributeValue[0] == 'number')) {
            if (Array.isArray(attributeValue)) {
              if (Array.isArray(oldValue)) {
                if (attributeValue.length !== oldValue.length) throw Object.assign(response, {
                  error: 'old and new' + ' value should have' + ' the same size when they are both arrays'
                });
                switch (operation) {
                  case '':
                    break;
                  case '+':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return oldValue[i] + v;
                    }.bind(this));
                    break;
                  case '*':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return oldValue[i] * v;
                    }.bind(this));
                    break;
                  case '-':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return oldValue[i] - v;
                    }.bind(this));
                    break;
                  case '/':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return oldValue[i] / v;
                    }.bind(this));
                    break;
                  case '**':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return Math.pow(oldValue[i], v);
                    }.bind(this));
                    break;
                  case '%':
                    attributeValue = attributeValue.map(function (v, i) {
                      _newArrowCheck(this, _this2);
                      return oldValue[i] % v;
                    }.bind(this));
                    break;
                  default:
                    throw Object.assign(response, {
                      error: 'unsupported' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
                    });
                }
              } else
                {
                  switch (operation) {
                    case '':
                      break;
                    case '+':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return oldValue + v;
                      }.bind(this));
                      break;
                    case '*':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return oldValue * v;
                      }.bind(this));
                      break;
                    case '-':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return oldValue - v;
                      }.bind(this));
                      break;
                    case '/':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return oldValue / v;
                      }.bind(this));
                      break;
                    case '**':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return Math.pow(oldValue, v);
                      }.bind(this));
                      break;
                    case '%':
                      attributeValue = attributeValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return oldValue % v;
                      }.bind(this));
                      break;
                    default:
                      throw Object.assign(response, {
                        error: 'unsupported' + ' value: ' + JSON.stringify(attributeValue) + ' for' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
                      });
                  }
                }
            } else
              {
                if (Array.isArray(oldValue)) {
                  switch (operation) {
                    case '':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return attributeValue;
                      }.bind(this));
                      break;
                    case '+':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return v + attributeValue;
                      }.bind(this));
                      break;
                    case '*':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return v * attributeValue;
                      }.bind(this));
                      break;
                    case '-':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return v - attributeValue;
                      }.bind(this));
                      break;
                    case '/':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return v / attributeValue;
                      }.bind(this));
                      break;
                    case '**':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return Math.pow(v, attributeValue);
                      }.bind(this));
                      break;
                    case '%':
                      attributeValue = oldValue.map(function (v) {
                        _newArrowCheck(this, _this2);
                        return v % attributeValue;
                      }.bind(this));
                      break;
                    default:
                      throw Object.assign(response, {
                        error: 'unsupported' + ' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
                      });
                  }
                } else
                  {
                    switch (operation) {
                      case '':
                        break;
                      case '+':
                        attributeValue = oldValue + attributeValue;
                        break;
                      case '*':
                        attributeValue = oldValue * attributeValue;
                        break;
                      case '-':
                        attributeValue = oldValue - attributeValue;
                        break;
                      case '/':
                        attributeValue = oldValue / attributeValue;
                        break;
                      case '**':
                        attributeValue = Math.pow(oldValue, attributeValue);
                        break;
                      case '%':
                        attributeValue = oldValue % attributeValue;
                        break;
                      default:
                        throw Object.assign(response, {
                          error: 'unsupported' + ' value: ' + JSON.stringify(attributeValue) + ' for operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
                        });
                    }
                  }
              }
          } else throw Object.assign(response, {
            error: 'operation: ' + operation + ' is invalid for old value: ' + JSON.stringify(oldValue) + ' and new value: ' + JSON.stringify(attributeValue)
          });
        }
        if (!stealth && (log || this._autoLog) && typeof this.win !== 'undefined') {
          var msg = this.name + ": " + attributeName + " = " + JSON.stringify(attributeValue);
          this.win.logOnFlip({
            msg: msg
          });
        }
        var previousAttributeValue = this['_' + attributeName];
        this['_' + attributeName] = attributeValue;
        return attributeValue !== previousAttributeValue;
      }
    }, {
      key: "_addAttributes",
      value: function _addAttributes(cls) {
        var _this3 = this;
        var callLine = cls.toString().match(/this.*\._addAttributes\(.*\;/)[0];
        var startIndex = callLine.indexOf('._addAttributes(') + 16;
        var endIndex = callLine.indexOf(');');
        var callArgs = callLine.substr(startIndex, endIndex - startIndex).split(',').map(function (s) {
          _newArrowCheck(this, _this3);
          return s.trim();
        }.bind(this));
        var attributeMap = new Map();
        for (var i = 1; i < callArgs.length; ++i) {
          attributeMap.set(callArgs[i], i - 1 + 1 < 1 || arguments.length <= i - 1 + 1 ? undefined : arguments[i - 1 + 1]);
        }
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;
        try {
          for (var _iterator2 = attributeMap.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _step2$value = _slicedToArray(_step2.value, 2),
                name = _step2$value[0],
                value = _step2$value[1];
            this._addAttribute(name, value);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    }, {
      key: "_addAttribute",
      value: function _addAttribute(name, value) {
        var _this4 = this;
        var getPropertyName = 'get' + name[0].toUpperCase() + name.substr(1);
        if (typeof this[getPropertyName] === 'undefined') this[getPropertyName] = function () {
          _newArrowCheck(this, _this4);
          return this['_' + name];
        }.bind(this);
        var setPropertyName = 'set' + name[0].toUpperCase() + name.substr(1);
        if (typeof this[setPropertyName] === 'undefined') this[setPropertyName] = function (value) {
          var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          _newArrowCheck(this, _this4);
          this._setAttribute(name, value, log);
        }.bind(this);
        Object.defineProperty(this, name, {
          configurable: true,
          get: function get() {
            return this[getPropertyName]();
          },
          set: function set(value) {
            this[setPropertyName](value);
          }
        });
        this[name] = value;
        this._userAttributes.add(name);
      }
    }, {
      key: "psychoJS",
      get: function get() {
        return this._psychoJS;
      }
      ,
      set: function set(psychoJS) {
        this._psychoJS = psychoJS;
      }
    }]);
    return PsychObject;
  }(EventEmitter);

  /**
   * Scheduler.
   *
   * @author Alain Pitiot
   * @version 3.2.5
   * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
   * @license Distributed under the terms of the MIT License
   */
  var Scheduler =
  function () {
    function Scheduler(psychoJS) {
      _classCallCheck(this, Scheduler);
      this._psychoJS = psychoJS;
      this._taskList = [];
      this._currentTask = undefined;
      this._argsList = [];
      this._currentArgs = undefined;
      this._stopAtNextUpdate = false;
      this._stopAtNextTask = false;
      this._status = Scheduler.Status.STOPPED;
    }
    _createClass(Scheduler, [{
      key: "add",
      value: function add(task) {
        this._taskList.push(task);
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        this._argsList.push(args);
      }
    }, {
      key: "addConditional",
      value: function addConditional(condition, thenScheduler, elseScheduler) {
        var self = this;
        var task = function task() {
          if (condition()) self.add(thenScheduler);else self.add(elseScheduler);
          return Scheduler.Event.NEXT;
        };
        this.add(task);
      }
    }, {
      key: "start",
      value: function start() {
        var _this = this;
        var self = this;
        var _update = function update() {
          _newArrowCheck(this, _this);
          if (self._stopAtNextUpdate) {
            self._status = Scheduler.Status.STOPPED;
            return;
          }
          var state = self._runNextTasks();
          if (state === Scheduler.Event.QUIT) {
            self._status = Scheduler.Status.STOPPED;
            return;
          }
          self._psychoJS.window.render();
          requestAnimationFrame(_update);
        }.bind(this);
        requestAnimationFrame(_update);
      }
    }, {
      key: "stop",
      value: function stop() {
        this._status = Scheduler.Status.STOPPED;
        this._stopAtNextTask = true;
        this._stopAtNextUpdate = true;
      }
    }, {
      key: "_runNextTasks",
      value: function _runNextTasks() {
        this._status = Scheduler.Status.RUNNING;
        var state = Scheduler.Event.NEXT;
        while (state === Scheduler.Event.NEXT) {
          if (this._stopAtNextTask) return Scheduler.Event.QUIT;
          if (typeof this._currentTask == 'undefined') {
            if (this._taskList.length > 0) {
              this._currentTask = this._taskList.shift();
              this._currentArgs = this._argsList.shift();
            }
            else {
                this._currentTask = undefined;
                this._currentArgs = undefined;
                return Scheduler.Event.QUIT;
              }
          }
          if (this._currentTask instanceof Function) {
            state = this._currentTask.apply(this, _toConsumableArray(this._currentArgs));
          }
          else {
              state = this._currentTask._runNextTasks();
              if (state === Scheduler.Event.QUIT) {
                if (!this._psychoJS.experiment.experimentEnded) state = Scheduler.Event.NEXT;
              }
            }
          if (state !== Scheduler.Event.FLIP_REPEAT) {
            this._currentTask = undefined;
            this._currentArgs = undefined;
          }
        }
        return state;
      }
    }, {
      key: "status",
      get: function get() {
        return this._status;
      }
    }]);
    return Scheduler;
  }();
  Scheduler.Event = {
    NEXT: Symbol["for"]('NEXT'),
    FLIP_REPEAT: Symbol["for"]('FLIP_REPEAT'),
    FLIP_NEXT: Symbol["for"]('FLIP_NEXT'),
    QUIT: Symbol["for"]('QUIT')
  };
  Scheduler.Status = {
    RUNNING: Symbol["for"]('RUNNING'),
    STOPPED: Symbol["for"]('STOPPED')
  };

  exports.Clock = Clock;
  exports.Color = Color;
  exports.ColorMixin = ColorMixin;
  exports.CountdownTimer = CountdownTimer;
  exports.EventEmitter = EventEmitter;
  exports.IsPointInsidePolygon = IsPointInsidePolygon;
  exports.MonotonicClock = MonotonicClock;
  exports.PsychObject = PsychObject;
  exports.Scheduler = Scheduler;
  exports.addInfoFromUrl = addInfoFromUrl;
  exports.detectBrowser = detectBrowser;
  exports.flattenArray = flattenArray;
  exports.getErrorStack = getErrorStack;
  exports.getPositionFromObject = getPositionFromObject;
  exports.getRequestError = getRequestError;
  exports.getUrlParameters = getUrlParameters;
  exports.isEmpty = isEmpty;
  exports.isInt = isInt;
  exports.makeUuid = makeUuid;
  exports.mix = mix;
  exports.offerDataForDownload = offerDataForDownload;
  exports.promiseToTupple = promiseToTupple;
  exports.selectFromArray = selectFromArray;
  exports.shuffle = shuffle;
  exports.sliceArray = sliceArray;
  exports.toNumerical = toNumerical;
  exports.toString = toString;
  exports.to_height = to_height;
  exports.to_norm = to_norm;
  exports.to_pixiPoint = to_pixiPoint;
  exports.to_px = to_px;
  exports.to_unit = to_unit;
  exports.to_win = to_win;

  return exports;

}({}));
var data = (function (exports, PsychObject_js, Clock_js, util) {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _newArrowCheck(innerThis, boundThis) {
    if (innerThis !== boundThis) {
      throw new TypeError("Cannot instantiate an arrow function");
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var ExperimentHandler =
  function (_PsychObject) {
    _inherits(ExperimentHandler, _PsychObject);
    _createClass(ExperimentHandler, [{
      key: "experimentEnded",
      get: function get() {
        return this._experimentEnded;
      }
      ,
      set: function set(ended) {
        this._experimentEnded = ended;
      }
    }, {
      key: "_thisEntry",
      get: function get() {
        return this._currentTrialData;
      }
    }, {
      key: "_entries",
      get: function get() {
        return this._trialsData;
      }
    }]);
    function ExperimentHandler() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          name = _ref.name,
          extraInfo = _ref.extraInfo;
      _classCallCheck(this, ExperimentHandler);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(ExperimentHandler).call(this, psychoJS, name));
      _this._addAttributes(ExperimentHandler, extraInfo);
      _this._loops = [];
      _this._unfinishedLoops = [];
      _this._trialsKeys = [];
      _this._trialsData = [];
      _this._currentTrialData = {};
      _this._experimentEnded = false;
      return _this;
    }
    _createClass(ExperimentHandler, [{
      key: "isEntryEmpty",
      value: function isEntryEmpty() {
        return Object.keys(this._currentTrialData).length > 0;
      }
    }, {
      key: "isEntryEmtpy",
      value: function isEntryEmtpy() {
        return Object.keys(this._currentTrialData).length > 0;
      }
    }, {
      key: "addLoop",
      value: function addLoop(loop) {
        this._loops.push(loop);
        this._unfinishedLoops.push(loop);
        loop.experimentHandler = this;
      }
    }, {
      key: "removeLoop",
      value: function removeLoop(loop) {
        var index = this._unfinishedLoops.indexOf(loop);
        if (index !== -1) this._unfinishedLoops.splice(index, 1);
      }
    }, {
      key: "addData",
      value: function addData(key, value) {
        if (this._trialsKeys.indexOf(key) === -1) {
          this._trialsKeys.push(key);
        }
        if (Array.isArray(value)) value = JSON.stringify(value);
        this._currentTrialData[key] = value;
      }
    }, {
      key: "nextEntry",
      value: function nextEntry(snapshots) {
        if (typeof snapshots !== 'undefined') {
          if (!Array.isArray(snapshots)) snapshots = [snapshots];
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;
          try {
            for (var _iterator = snapshots[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var snapshot = _step.value;
              var attributes = ExperimentHandler._getLoopAttributes(snapshot);
              for (var a in attributes) {
                if (attributes.hasOwnProperty(a)) this._currentTrialData[a] = attributes[a];
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        else {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;
            try {
              for (var _iterator2 = this._unfinishedLoops[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var loop = _step2.value;
                var _attributes = ExperimentHandler._getLoopAttributes(loop);
                for (var _a in _attributes) {
                  if (_attributes.hasOwnProperty(_a)) this._currentTrialData[_a] = _attributes[_a];
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                  _iterator2["return"]();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          }
        for (var _a2 in this.extraInfo) {
          if (this.extraInfo.hasOwnProperty(_a2)) this._currentTrialData[_a2] = this.extraInfo[_a2];
        }
        this._trialsData.push(this._currentTrialData);
        this._currentTrialData = {};
      }
    }, {
      key: "save",
      value: function () {
        var _save = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee() {
          var _ref2,
              _ref2$attributes,
              attributes,
              l,
              loop,
              loopAttributes,
              a,
              _a3,
              info,
              __experimentName,
              __participant,
              __session,
              __datetime,
              gitlabConfig,
              __projectId,
              worksheet,
              csv,
              key,
              documents,
              r,
              doc,
              h,
              _key,
              _args = arguments;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _ref2 = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, _ref2$attributes = _ref2.attributes, attributes = _ref2$attributes === void 0 ? [] : _ref2$attributes;
                  this._psychoJS.logger.info('[PsychoJS] Save experiment results.');
                  if (attributes.length === 0) {
                    attributes = this._trialsKeys.slice();
                    for (l = 0; l < this._loops.length; l++) {
                      loop = this._loops[l];
                      loopAttributes = ExperimentHandler._getLoopAttributes(loop);
                      for (a in loopAttributes) {
                        if (loopAttributes.hasOwnProperty(a)) attributes.push(a);
                      }
                    }
                    for (_a3 in this.extraInfo) {
                      if (this.extraInfo.hasOwnProperty(_a3)) attributes.push(_a3);
                    }
                  }
                  info = this.extraInfo;
                  __experimentName = typeof info.expName !== 'undefined' ? info.expName : this.psychoJS.config.experiment.name;
                  __participant = typeof info.participant === 'string' && info.participant.length > 0 ? info.participant : 'PARTICIPANT';
                  __session = typeof info.session === 'string' && info.session.length > 0 ? info.session : 'SESSION';
                  __datetime = typeof info.date !== 'undefined' ? info.date : Clock_js.MonotonicClock.getDateStr();
                  gitlabConfig = this._psychoJS.config.gitlab;
                  __projectId = typeof gitlabConfig !== 'undefined' && typeof gitlabConfig.projectId !== 'undefined' ? gitlabConfig.projectId : undefined;
                  if (!(this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV)) {
                    _context.next = 21;
                    break;
                  }
                  worksheet = XLSX.utils.json_to_sheet(this._trialsData);
                  csv = XLSX.utils.sheet_to_csv(worksheet);
                  key = __participant + '_' + __experimentName + '_' + __datetime + '.csv';
                  if (!(this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER && this._psychoJS.config.experiment.status === 'RUNNING')) {
                    _context.next = 18;
                    break;
                  }
                  return _context.abrupt("return",
                  this._psychoJS.serverManager.uploadData(key, csv));
                case 18:
                  util.offerDataForDownload(key, csv, 'text/csv');
                case 19:
                  _context.next = 32;
                  break;
                case 21:
                  if (!(this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE)) {
                    _context.next = 32;
                    break;
                  }
                  documents = [];
                  for (r = 0; r < this._trialsData.length; r++) {
                    doc = {
                      __projectId: __projectId,
                      __experimentName: __experimentName,
                      __participant: __participant,
                      __session: __session,
                      __datetime: __datetime
                    };
                    for (h = 0; h < attributes.length; h++) {
                      doc[attributes[h]] = this._trialsData[r][attributes[h]];
                    }
                    documents.push(doc);
                  }
                  if (!(this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER)) {
                    _context.next = 31;
                    break;
                  }
                  _key = 'results';
                  _context.next = 28;
                  return this._psychoJS.serverManager.uploadData(_key, JSON.stringify(documents));
                case 28:
                  return _context.abrupt("return", _context.sent);
                case 31:
                  util.offerDataForDownload('results.json', JSON.stringify(documents), 'application/json');
                case 32:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));
        function save() {
          return _save.apply(this, arguments);
        }
        return save;
      }()
    }], [{
      key: "_getLoopAttributes",
      value: function _getLoopAttributes(loop) {
        var properties = ['thisRepN', 'thisTrialN', 'thisN', 'thisIndex', 'stepSizeCurrent', 'ran', 'order'];
        var attributes = {};
        var loopName = loop.name;
        for (var loopProperty in loop) {
          if (properties.includes(loopProperty)) {
            var key = loopProperty === 'stepSizeCurrent' ? loopName + '.stepSize' : loopName + '.' + loopProperty;
            attributes[key] = loop[loopProperty];
          }
        }
        if (typeof loop.getCurrentTrial === 'function') {
          var currentTrial = loop.getCurrentTrial();
          for (var trialProperty in currentTrial) {
            attributes[trialProperty] = currentTrial[trialProperty];
          }
        }
        return attributes;
      }
    }]);
    return ExperimentHandler;
  }(PsychObject_js.PsychObject);
  ExperimentHandler.SaveFormat = {
    CSV: Symbol["for"]('CSV'),
    DATABASE: Symbol["for"]('DATABASE')
  };
  ExperimentHandler.Environment = {
    SERVER: Symbol["for"]('SERVER'),
    LOCAL: Symbol["for"]('LOCAL')
  };

  var TrialHandler =
  function (_PsychObject) {
    _inherits(TrialHandler, _PsychObject);
    _createClass(TrialHandler, [{
      key: "experimentHandler",
      get: function get() {
        return this._experimentHandler;
      }
      ,
      set: function set(exp) {
        this._experimentHandler = exp;
      }
    }]);
    function TrialHandler() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          _ref$trialList = _ref.trialList,
          trialList = _ref$trialList === void 0 ? [undefined] : _ref$trialList,
          nReps = _ref.nReps,
          _ref$method = _ref.method,
          method = _ref$method === void 0 ? TrialHandler.Method.RANDOM : _ref$method,
          _ref$extraInfo = _ref.extraInfo,
          extraInfo = _ref$extraInfo === void 0 ? [] : _ref$extraInfo,
          seed = _ref.seed,
          name = _ref.name,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? true : _ref$autoLog;
      _classCallCheck(this, TrialHandler);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(TrialHandler).call(this, psychoJS));
      _this._addAttributes(TrialHandler, trialList, nReps, method, extraInfo, seed, name, autoLog);
      _this._prepareTrialList(trialList);
      _this.nStim = _this.trialList.length;
      _this.nTotal = _this.nReps * _this.nStim;
      _this.nRemaining = _this.nTotal;
      _this.thisRepN = 0;
      _this.thisTrialN = -1;
      _this.thisN = -1;
      _this.thisIndex = 0;
      _this.ran = 0;
      _this.order = -1;
      _this._prepareSequence();
      _this._experimentHandler = null;
      _this.thisTrial = null;
      _this.finished = false;
      return _this;
    }
    _createClass(TrialHandler, [{
      key: Symbol.iterator,
      value: function value() {
        var _this2 = this;
        return {
          next: function next() {
            _newArrowCheck(this, _this2);
            this.thisTrialN++;
            this.thisN++;
            this.nRemaining--;
            if (this.nRemaining === 0) {
              this.finished = true;
            }
            if (this.thisTrialN === this.nStim) {
              this.thisTrialN = 0;
              this.thisRepN++;
            }
            if (this.thisRepN >= this.nReps) {
              this.thisTrial = null;
              return {
                done: true
              };
            }
            this.thisIndex = this._trialSequence[this.thisRepN][this.thisTrialN];
            this.thisTrial = this.trialList[this.thisIndex];
            this.ran = 1;
            this.order = this.thisN;
            return {
              value: this.thisTrial,
              done: false
            };
          }.bind(this)
        };
      }
    }, {
      key: "forEach",
      value: function forEach(callback) {
        var trialIterator = this[Symbol.iterator]();
        while (true) {
          var result = trialIterator.next();
          if (result.done) break;
          callback(result.value);
        }
      }
    }, {
      key: "getSnapshot",
      value: function getSnapshot() {
        var _this3 = this;
        var currentIndex = this.thisIndex;
        var snapshot = {
          name: this.name,
          nStim: this.nStim,
          nTotal: this.nTotal,
          nRemaining: this.nRemaining,
          thisRepN: this.thisRepN,
          thisTrialN: this.thisTrialN,
          thisN: this.thisN,
          thisIndex: this.thisIndex,
          ran: this.ran,
          finished: this.finished,
          getCurrentTrial: function getCurrentTrial() {
            _newArrowCheck(this, _this3);
            return this.getTrial(currentIndex);
          }.bind(this)
        };
        return snapshot;
      }
    }, {
      key: "getTrialIndex",
      value: function getTrialIndex() {
        return this.thisIndex;
      }
    }, {
      key: "setTrialIndex",
      value: function setTrialIndex(index) {
        this.thisIndex = index;
      }
    }, {
      key: "getAttributes",
      value: function getAttributes() {
        if (!Array.isArray(this.trialList) || this.nStim === 0) return [];
        var firstTrial = this.trialList[0];
        if (!firstTrial) return [];
        return Object.keys(this.trialList[0]);
      }
    }, {
      key: "getCurrentTrial",
      value: function getCurrentTrial() {
        return this.trialList[this.thisIndex];
      }
    }, {
      key: "getTrial",
      value: function getTrial() {
        var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        if (index < 0 || index > this.nTotal) return undefined;
        return this.trialList[index];
      }
    }, {
      key: "getFutureTrial",
      value: function getFutureTrial() {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        if (this.thisIndex + n < 0 || n > this.nRemaining) return undefined;
        return this.trialList[this.thisIndex + n];
      }
    }, {
      key: "getEarlierTrial",
      value: function getEarlierTrial() {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
        return getFutureTrial(-abs(n));
      }
    }, {
      key: "addData",
      value: function addData(key, value) {
        if (this._experimentHandler) this._experimentHandler.addData(key, value);
      }
    }, {
      key: "_prepareTrialList",
      value: function _prepareTrialList(trialList) {
        var response = {
          origin: 'TrialHandler._prepareTrialList',
          context: 'when preparing the trial list'
        };
        if (typeof trialList === 'undefined') this.trialList = [undefined];
        else if (Array.isArray(trialList)) {
            if (trialList.length === 0) this.trialList = [undefined];
          }
          else if (typeof trialList === 'string') this.trialList = TrialHandler.importConditions(this.psychoJS.serverManager, trialList);
            else throw Object.assign(response, {
                error: 'unable to prepare trial list:' + ' unknown type: ' + _typeof(trialList)
              });
      }
    }, {
      key: "_prepareSequence",
      value: function _prepareSequence() {
        var response = {
          origin: 'TrialHandler._prepareSequence',
          context: 'when preparing a sequence of trials'
        };
        var indices = Array.from(this.trialList.keys());
        if (typeof this.seed !== 'undefined') Math.seedrandom(this.seed);else Math.seedrandom();
        if (this.method === TrialHandler.Method.SEQUENTIAL) {
          this._trialSequence = Array(this.nReps).fill(indices);
        } else if (this.method === TrialHandler.Method.RANDOM) {
          this._trialSequence = [];
          for (var i = 0; i < this.nReps; ++i) {
            this._trialSequence.push(util.shuffle(indices.slice()));
          }
        } else if (this.method === TrialHandler.Method.FULL_RANDOM) {
          var flatSequence = [];
          for (var _i = 0; _i < this.nReps; ++_i) {
            flatSequence.push.apply(flatSequence, indices);
          }
          util.shuffle(flatSequence);
          this._trialSequence = [];
          for (var _i2 = 0; _i2 < this.nReps; _i2++) {
            this._trialSequence.push(flatSequence.slice(_i2 * this.nStim, (_i2 + 1) * this.nStim));
          }
        } else {
          throw Object.assign(response, {
            error: 'unknown method'
          });
        }
        return this._trialSequence;
      }
    }], [{
      key: "importConditions",
      value: function importConditions(serverManager, resourceName) {
        var selection = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        try {
          var resourceExtension = resourceName.split('.').pop();
          if (['csv', 'odp', 'xls', 'xlsx'].indexOf(resourceExtension) > -1) {
            var resourceValue = serverManager.getResource(resourceName);
            var workbook = XLSX.read(new Uint8Array(resourceValue), {
              type: "array"
            });
            if (workbook.SheetNames.length === 0) throw 'workbook should contain at least one worksheet';
            var sheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[sheetName];
            var sheet = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              blankrows: false
            });
            var fields = sheet.shift();
            var selectedRows = selection === null ? sheet : util.selectFromArray(sheet, selection);
            var trialList = new Array(selectedRows.length - 1);
            for (var r = 0; r < selectedRows.length; ++r) {
              var row = selectedRows[r];
              var trial = {};
              for (var l = 0; l < fields.length; ++l) {
                var value = row[l];
                if (typeof value === 'string' && !isNaN(value)) {
                  value = Number.parseFloat(value);
                }
                trial[fields[l]] = value;
              }
              trialList[r] = trial;
            }
            return trialList;
          } else {
            throw 'extension: ' + resourceExtension + ' currently not supported.';
          }
        } catch (error) {
          throw {
            origin: 'TrialHandler.importConditions',
            context: "when importing condition: ".concat(resourceName),
            error: error
          };
        }
      }
    }]);
    return TrialHandler;
  }(PsychObject_js.PsychObject);
  TrialHandler.Method = {
    SEQUENTIAL: Symbol["for"]('SEQUENTIAL'),
    RANDOM: Symbol["for"]('RANDOM'),
    FULL_RANDOM: Symbol["for"]('FULL_RANDOM')
  };

  exports.ExperimentHandler = ExperimentHandler;
  exports.TrialHandler = TrialHandler;

  return exports;

}({}, util, util, util));
var core = (function (exports, Clock_js, Scheduler_js, PsychObject_js, util$1, ExperimentHandler_js, Color_js) {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _newArrowCheck(innerThis, boundThis) {
    if (innerThis !== boundThis) {
      throw new TypeError("Cannot instantiate an arrow function");
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  var ServerManager =
  function (_PsychObject) {
    _inherits(ServerManager, _PsychObject);
    function ServerManager() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? false : _ref$autoLog;
      _classCallCheck(this, ServerManager);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(ServerManager).call(this, psychoJS));
      _this._session = {};
      _this._resources = new Map();
      _this._nbResources = -1;
      _this._addAttributes(ServerManager, autoLog);
      _this._addAttribute('status', ServerManager.Status.READY);
      return _this;
    }
    _createClass(ServerManager, [{
      key: "getConfiguration",
      value: function getConfiguration(configURL) {
        var _this2 = this;
        var response = {
          origin: 'ServerManager.getConfiguration',
          context: 'when reading the configuration file: ' + configURL
        };
        this._psychoJS.logger.debug('reading the configuration file: ' + configURL);
        return new Promise(function (resolve, reject) {
          var _this3 = this;
          _newArrowCheck(this, _this2);
          $.get(configURL, 'json').done(function (config, textStatus) {
            _newArrowCheck(this, _this3);
            resolve(Object.assign(response, {
              config: config
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this3);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "openSession",
      value: function openSession() {
        var _this4 = this;
        var response = {
          origin: 'ServerManager.openSession',
          context: 'when opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath
        };
        this._psychoJS.logger.debug('opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath);
        this.setStatus(ServerManager.Status.BUSY);
        var data = {};
        if (this._psychoJS._serverMsg.has('__pilotToken')) data.pilotToken = this._psychoJS._serverMsg.get('__pilotToken');
        var self = this;
        return new Promise(function (resolve, reject) {
          var _this5 = this;
          _newArrowCheck(this, _this4);
          var url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions';
          $.post(url, data, null, 'json').done(function (data, textStatus) {
            _newArrowCheck(this, _this5);
            if (!('token' in data)) {
              self.setStatus(ServerManager.Status.ERROR);
              reject(Object.assign(response, {
                error: 'unexpected answer from server: no token'
              }));
            }
            self._psychoJS.config.session = {
              token: data.token
            };
            if (!('experiment' in data)) {
              self.setStatus(ServerManager.Status.ERROR);
              reject(Object.assign(response, {
                error: 'unexpected answer from server: no experiment'
              }));
            }
            self._psychoJS.config.experiment.status = data.experiment.status2;
            self._psychoJS.config.experiment.saveFormat = Symbol["for"](data.experiment.saveFormat);
            self._psychoJS.config.experiment.license = data.experiment.license;
            self._psychoJS.config.experiment.runMode = data.experiment.runMode;
            self.setStatus(ServerManager.Status.READY);
            resolve(Object.assign(response, {
              token: data.token,
              status: data.status
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this5);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "closeSession",
      value: function closeSession() {
        var _this6 = this;
        var isCompleted = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var sync = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'ServerManager.closeSession',
          context: 'when closing the session for experiment: ' + this._psychoJS.config.experiment.fullpath
        };
        this._psychoJS.logger.debug('closing the session for experiment: ' + this._psychoJS.config.experiment.name);
        this.setStatus(ServerManager.Status.BUSY);
        var url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/sessions/' + this._psychoJS.config.session.token;
        var data = {
          isCompleted: isCompleted
        };
        if (sync) {
          var request = new XMLHttpRequest();
          request.open("DELETE", url, false);
          request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
          request.send(JSON.stringify(data));
          return;
        }
        var self = this;
        return new Promise(function (resolve, reject) {
          var _this7 = this;
          _newArrowCheck(this, _this6);
          $.ajax({
            url: url,
            type: 'delete',
            data: data,
            dataType: 'json'
          }).done(function (data, textStatus) {
            _newArrowCheck(this, _this7);
            self.setStatus(ServerManager.Status.READY);
            resolve(Object.assign(response, {
              data: data
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this7);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "getResource",
      value: function getResource(name) {
        var response = {
          origin: 'ServerManager.getResource',
          context: 'when getting the value of resource: ' + name
        };
        var path_data = this._resources.get(name);
        if (typeof path_data === 'undefined')
          throw Object.assign(response, {
            error: 'unknown resource'
          });
        return path_data.data;
      }
    }, {
      key: "setStatus",
      value: function setStatus(status) {
        var response = {
          origin: 'ServerManager.setStatus',
          context: 'when changing the status of the server manager to: ' + util$1.toString(status)
        };
        var statusKey = _typeof(status) === 'symbol' ? Symbol.keyFor(status) : null;
        if (!statusKey)
          throw Object.assign(response, {
            error: 'status must be a symbol'
          });
        if (!ServerManager.Status.hasOwnProperty(statusKey))
          throw Object.assign(response, {
            error: 'unknown status'
          });
        this._status = status;
        this.emit(ServerManager.Event.STATUS, this._status);
        return this._status;
      }
    }, {
      key: "resetStatus",
      value: function resetStatus() {
        return this.setStatus(ServerManager.Status.READY);
      }
    }, {
      key: "downloadResources",
      value: function downloadResources() {
        var _this8 = this;
        var resources = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var response = {
          origin: 'ServerManager.downloadResources',
          context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
        };
        this._psychoJS.logger.debug('downloading resources for experiment: ' + this._psychoJS.config.experiment.name);
        var self = this;
        var download =
        function () {
          var _download = _asyncToGenerator(
          regeneratorRuntime.mark(function _callee() {
            var serverResponse, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, name, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _step2$value, _name, path, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _step3$value, _name2, _path, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _name3;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _newArrowCheck(this, _this8);
                    _context.prev = 1;
                    if (!(self._psychoJS.config.environment === ExperimentHandler_js.ExperimentHandler.Environment.SERVER)) {
                      _context.next = 49;
                      break;
                    }
                    if (!(resources.length === 0)) {
                      _context.next = 28;
                      break;
                    }
                    _context.next = 6;
                    return self._listResources();
                  case 6:
                    serverResponse = _context.sent;
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context.prev = 10;
                    for (_iterator = serverResponse.resources[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                      name = _step.value;
                      self._resources.set(name, {
                        path: serverResponse.resourceDirectory + '/' + name
                      });
                    }
                    _context.next = 18;
                    break;
                  case 14:
                    _context.prev = 14;
                    _context.t0 = _context["catch"](10);
                    _didIteratorError = true;
                    _iteratorError = _context.t0;
                  case 18:
                    _context.prev = 18;
                    _context.prev = 19;
                    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                      _iterator["return"]();
                    }
                  case 21:
                    _context.prev = 21;
                    if (!_didIteratorError) {
                      _context.next = 24;
                      break;
                    }
                    throw _iteratorError;
                  case 24:
                    return _context.finish(21);
                  case 25:
                    return _context.finish(18);
                  case 26:
                    _context.next = 47;
                    break;
                  case 28:
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context.prev = 31;
                    for (_iterator2 = resources[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      _step2$value = _step2.value, _name = _step2$value.name, path = _step2$value.path;
                      self._resources.set(_name, {
                        path: path
                      });
                    }
                    _context.next = 39;
                    break;
                  case 35:
                    _context.prev = 35;
                    _context.t1 = _context["catch"](31);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context.t1;
                  case 39:
                    _context.prev = 39;
                    _context.prev = 40;
                    if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                      _iterator2["return"]();
                    }
                  case 42:
                    _context.prev = 42;
                    if (!_didIteratorError2) {
                      _context.next = 45;
                      break;
                    }
                    throw _iteratorError2;
                  case 45:
                    return _context.finish(42);
                  case 46:
                    return _context.finish(39);
                  case 47:
                    _context.next = 68;
                    break;
                  case 49:
                    _iteratorNormalCompletion3 = true;
                    _didIteratorError3 = false;
                    _iteratorError3 = undefined;
                    _context.prev = 52;
                    for (_iterator3 = resources[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      _step3$value = _step3.value, _name2 = _step3$value.name, _path = _step3$value.path;
                      self._resources.set(_name2, {
                        path: _path
                      });
                    }
                    _context.next = 60;
                    break;
                  case 56:
                    _context.prev = 56;
                    _context.t2 = _context["catch"](52);
                    _didIteratorError3 = true;
                    _iteratorError3 = _context.t2;
                  case 60:
                    _context.prev = 60;
                    _context.prev = 61;
                    if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                      _iterator3["return"]();
                    }
                  case 63:
                    _context.prev = 63;
                    if (!_didIteratorError3) {
                      _context.next = 66;
                      break;
                    }
                    throw _iteratorError3;
                  case 66:
                    return _context.finish(63);
                  case 67:
                    return _context.finish(60);
                  case 68:
                    self._nbResources = self._resources.size;
                    _iteratorNormalCompletion4 = true;
                    _didIteratorError4 = false;
                    _iteratorError4 = undefined;
                    _context.prev = 72;
                    for (_iterator4 = self._resources.keys()[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      _name3 = _step4.value;
                      this._psychoJS.logger.debug('resource:', _name3, self._resources.get(_name3).path);
                    }
                    _context.next = 80;
                    break;
                  case 76:
                    _context.prev = 76;
                    _context.t3 = _context["catch"](72);
                    _didIteratorError4 = true;
                    _iteratorError4 = _context.t3;
                  case 80:
                    _context.prev = 80;
                    _context.prev = 81;
                    if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                      _iterator4["return"]();
                    }
                  case 83:
                    _context.prev = 83;
                    if (!_didIteratorError4) {
                      _context.next = 86;
                      break;
                    }
                    throw _iteratorError4;
                  case 86:
                    return _context.finish(83);
                  case 87:
                    return _context.finish(80);
                  case 88:
                    self.emit(ServerManager.Event.RESOURCE, {
                      message: ServerManager.Event.RESOURCES_REGISTERED,
                      count: self._nbResources
                    });
                    _context.next = 91;
                    return self._downloadRegisteredResources();
                  case 91:
                    _context.next = 97;
                    break;
                  case 93:
                    _context.prev = 93;
                    _context.t4 = _context["catch"](1);
                    console.log('error', _context.t4);
                    throw Object.assign(response, {
                      error: _context.t4
                    });
                  case 97:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[1, 93], [10, 14, 18, 26], [19,, 21, 25], [31, 35, 39, 47], [40,, 42, 46], [52, 56, 60, 68], [61,, 63, 67], [72, 76, 80, 88], [81,, 83, 87]]);
          }));
          function download() {
            return _download.apply(this, arguments);
          }
          return download;
        }().bind(this);
        download();
      }
    }, {
      key: "uploadData",
      value: function uploadData(key, value) {
        var _this9 = this;
        var response = {
          origin: 'ServerManager.uploadData',
          context: 'when uploading participant\'s results for experiment: ' + this._psychoJS.config.experiment.fullpath
        };
        this._psychoJS.logger.debug('uploading data for experiment: ' + this._psychoJS.config.experiment.fullpath);
        this.setStatus(ServerManager.Status.BUSY);
        var data = {
          key: key,
          value: value
        };
        var self = this;
        return new Promise(function (resolve, reject) {
          var _this10 = this;
          _newArrowCheck(this, _this9);
          var url = self._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions/' + self._psychoJS.config.session.token + '/results';
          $.post(url, data, null, 'json').done(function (serverData, textStatus) {
            _newArrowCheck(this, _this10);
            self.setStatus(ServerManager.Status.READY);
            resolve(Object.assign(response, {
              serverData: serverData
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this10);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "uploadLog",
      value: function uploadLog(logs) {
        var _this11 = this;
        var compressed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'ServerManager.uploadLog',
          context: 'when uploading participant\'s log for experiment: ' + this._psychoJS.config.experiment.fullpath
        };
        this._psychoJS.logger.debug('uploading server log for experiment: ' + this._psychoJS.config.experiment.fullpath);
        this.setStatus(ServerManager.Status.BUSY);
        var info = this.psychoJS.experiment.extraInfo;
        var participant = typeof info.participant === 'string' && info.participant.length > 0 ? info.participant : 'PARTICIPANT';
        var experimentName = typeof info.expName !== 'undefined' ? info.expName : this.psychoJS.config.experiment.name;
        var datetime = typeof info.date !== 'undefined' ? info.date : Clock_js.MonotonicClock.getDateStr();
        var filename = participant + '_' + experimentName + '_' + datetime + '.log';
        var data = {
          filename: filename,
          logs: logs,
          compressed: compressed
        };
        var self = this;
        return new Promise(function (resolve, reject) {
          var _this12 = this;
          _newArrowCheck(this, _this11);
          var url = self._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions/' + self._psychoJS.config.session.token + '/logs';
          $.post(url, data, null, 'json').done(function (serverData, textStatus) {
            _newArrowCheck(this, _this12);
            self.setStatus(ServerManager.Status.READY);
            resolve(Object.assign(response, {
              serverData: serverData
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this12);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "_listResources",
      value: function _listResources() {
        var _this13 = this;
        var response = {
          origin: 'ServerManager._listResourcesSession',
          context: 'when listing the resources for experiment: ' + this._psychoJS.config.experiment.fullpath
        };
        this._psychoJS.logger.debug('listing the resources for experiment: ' + this._psychoJS.config.experiment.fullpath);
        this.setStatus(ServerManager.Status.BUSY);
        var data = {
          'token': this._psychoJS.config.session.token
        };
        var self = this;
        return new Promise(function (resolve, reject) {
          var _this14 = this;
          _newArrowCheck(this, _this13);
          var url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/resources';
          $.get(url, data, null, 'json').done(function (data, textStatus) {
            _newArrowCheck(this, _this14);
            if (!('resources' in data)) {
              self.setStatus(ServerManager.Status.ERROR);
              reject(Object.assign(response, {
                error: 'unexpected answer from server: no resources'
              }));
            }
            if (!('resourceDirectory' in data)) {
              self.setStatus(ServerManager.Status.ERROR);
              reject(Object.assign(response, {
                error: 'unexpected answer from server: no resourceDirectory'
              }));
            }
            self.setStatus(ServerManager.Status.READY);
            resolve(Object.assign(response, {
              resources: data.resources,
              resourceDirectory: data.resourceDirectory
            }));
          }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
            _newArrowCheck(this, _this14);
            self.setStatus(ServerManager.Status.ERROR);
            var errorMsg = util$1.getRequestError(jqXHR, textStatus, errorThrown);
            console.error('error:', errorMsg);
            reject(Object.assign(response, {
              error: errorMsg
            }));
          }.bind(this));
        }.bind(this));
      }
    }, {
      key: "_downloadRegisteredResources",
      value: function _downloadRegisteredResources() {
        var _this15 = this;
        var response = {
          origin: 'ServerManager._downloadResources',
          context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
        };
        this._psychoJS.logger.debug('downloading the registered resources for experiment: ' + this._psychoJS.config.experiment.name);
        this.setStatus(ServerManager.Status.BUSY);
        this._nbLoadedResources = 0;
        this._resourceQueue = new createjs.LoadQueue(true);
        var self = this;
        this._resourceQueue.addEventListener("filestart", function (event) {
          _newArrowCheck(this, _this15);
          self.emit(ServerManager.Event.RESOURCE, {
            message: ServerManager.Event.DOWNLOADING_RESOURCE,
            resource: event.item.id
          });
        }.bind(this));
        this._resourceQueue.addEventListener("fileload", function (event) {
          _newArrowCheck(this, _this15);
          ++self._nbLoadedResources;
          var path_data = self._resources.get(event.item.id);
          path_data.data = event.result;
          self.emit(ServerManager.Event.RESOURCE, {
            message: ServerManager.Event.RESOURCE_DOWNLOADED,
            resource: event.item.id
          });
        }.bind(this));
        this._resourceQueue.addEventListener("complete", function (event) {
          _newArrowCheck(this, _this15);
          self._resourceQueue.close();
          if (self._nbLoadedResources === self._nbResources) {
            self.setStatus(ServerManager.Status.READY);
            self.emit(ServerManager.Event.RESOURCE, {
              message: ServerManager.Event.DOWNLOAD_COMPLETED
            });
          }
        }.bind(this));
        this._resourceQueue.addEventListener("error", function (event) {
          _newArrowCheck(this, _this15);
          self.setStatus(ServerManager.Status.ERROR);
          var resourceId = typeof event.data !== 'undefined' ? event.data.id : 'UNKNOWN RESOURCE';
          throw Object.assign(response, {
            error: 'unable to download resource: ' + resourceId + ' (' + event.title + ')'
          });
        }.bind(this));
        var manifest = [];
        var soundResources = [];
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;
        try {
          for (var _iterator5 = this._resources[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _step5$value = _slicedToArray(_step5.value, 2),
                name = _step5$value[0],
                path_data = _step5$value[1];
            var extension = name.split('.').pop();
            if (['csv', 'odp', 'xls', 'xlsx'].indexOf(extension) > -1) manifest.push({
              id: name,
              src: path_data.path,
              type: createjs.Types.BINARY
            });
            else if (['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'weba', 'dolby', 'flac'].indexOf(extension) > -1) soundResources.push(name);
              else manifest.push({
                  id: name,
                  src: path_data.path
                });
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
              _iterator5["return"]();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
        if (manifest.length > 0) this._resourceQueue.loadManifest(manifest);else {
          if (this._nbLoadedResources === this._nbResources) {
            this.setStatus(ServerManager.Status.READY);
            this.emit(ServerManager.Event.RESOURCE, {
              message: ServerManager.Event.DOWNLOAD_COMPLETED
            });
          }
        }
        var _loop = function _loop() {
          var _this16 = this;
          var name = _soundResources[_i];
          self.emit(ServerManager.Event.RESOURCE, {
            message: ServerManager.Event.DOWNLOADING_RESOURCE,
            resource: name
          });
          var path_data = self._resources.get(name);
          var howl = new Howl({
            src: path_data.path,
            preload: false,
            autoplay: false
          });
          howl.on('load', function (event) {
            _newArrowCheck(this, _this16);
            ++self._nbLoadedResources;
            path_data.data = howl;
            self.emit(ServerManager.Event.RESOURCE, {
              message: ServerManager.Event.RESOURCE_DOWNLOADED,
              resource: name
            });
            if (self._nbLoadedResources === self._nbResources) {
              self.setStatus(ServerManager.Status.READY);
              self.emit(ServerManager.Event.RESOURCE, {
                message: ServerManager.Event.DOWNLOAD_COMPLETED
              });
            }
          }.bind(this));
          howl.on('loaderror', function (id, error) {
            _newArrowCheck(this, _this16);
            throw Object.assign(response, {
              error: 'unable to download resource: ' + name + ' (' + util$1.toString(error) + ')'
            });
          }.bind(this));
          howl.load();
        };
        for (var _i = 0, _soundResources = soundResources; _i < _soundResources.length; _i++) {
          _loop();
        }
      }
    }]);
    return ServerManager;
  }(PsychObject_js.PsychObject);
  ServerManager.Event = {
    RESOURCE: Symbol["for"]('RESOURCE'),
    RESOURCES_REGISTERED: Symbol["for"]('RESOURCES_REGISTERED'),
    DOWNLOADING_RESOURCE: Symbol["for"]('DOWNLOADING_RESOURCE'),
    RESOURCE_DOWNLOADED: Symbol["for"]('RESOURCE_DOWNLOADED'),
    DOWNLOAD_COMPLETED: Symbol["for"]('DOWNLOAD_COMPLETED'),
    STATUS: Symbol["for"]('STATUS')
  };
  ServerManager.Status = {
    READY: Symbol["for"]('READY'),
    BUSY: Symbol["for"]('BUSY'),
    ERROR: Symbol["for"]('ERROR')
  };

  var Logger =
  function () {
    function Logger(psychoJS, threshold) {
      _classCallCheck(this, Logger);
      this._psychoJS = psychoJS;
      this.consoleLogger = log4javascript.getLogger('psychojs');
      var appender = new log4javascript.BrowserConsoleAppender();
      appender.setLayout(this._customConsoleLayout());
      appender.setThreshold(threshold);
      this.consoleLogger.addAppender(appender);
      this.consoleLogger.setLevel(threshold);
      this._serverLogs = [];
    }
    _createClass(Logger, [{
      key: "exp",
      value: function exp(msg, time, obj) {
        this.log(msg, Logger.ServerLevel.EXP, time, obj);
      }
    }, {
      key: "data",
      value: function data(msg, time, obj) {
        this.log(msg, Logger.ServerLevel.DATA, time, obj);
      }
    }, {
      key: "log",
      value: function log(msg, level, time, obj) {
        if (typeof time === 'undefined') time = Clock_js.MonotonicClock.getReferenceTime();
        this._serverLogs.push({
          msg: msg,
          level: level,
          time: time,
          obj: util$1.toString(obj)
        });
      }
    }, {
      key: "flush",
      value: function () {
        var _flush = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee() {
          var response, formattedLogs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, log, formattedLog, utf16DeflatedLogs, base64DeflatedLogs;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  response = {
                    origin: 'Logger.flush',
                    context: 'when flushing participant\'s logs for experiment: ' + this._psychoJS.config.experiment.fullpath
                  };
                  this._psychoJS.logger.info('[PsychoJS] Flush server logs.');
                  formattedLogs = '';
                  _iteratorNormalCompletion = true;
                  _didIteratorError = false;
                  _iteratorError = undefined;
                  _context.prev = 6;
                  for (_iterator = this._serverLogs[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    log = _step.value;
                    formattedLog = util$1.toString(log.time) + '\t' + Symbol.keyFor(log.level) + '\t' + log.msg;
                    if (log.obj !== 'undefined') formattedLog += '\t' + log.obj;
                    formattedLog += '\n';
                    formattedLogs += formattedLog;
                  }
                  _context.next = 14;
                  break;
                case 10:
                  _context.prev = 10;
                  _context.t0 = _context["catch"](6);
                  _didIteratorError = true;
                  _iteratorError = _context.t0;
                case 14:
                  _context.prev = 14;
                  _context.prev = 15;
                  if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                    _iterator["return"]();
                  }
                case 17:
                  _context.prev = 17;
                  if (!_didIteratorError) {
                    _context.next = 20;
                    break;
                  }
                  throw _iteratorError;
                case 20:
                  return _context.finish(17);
                case 21:
                  return _context.finish(14);
                case 22:
                  if (!(this._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER && this._psychoJS.config.experiment.status === 'RUNNING')) {
                    _context.next = 43;
                    break;
                  }
                  if (!(typeof pako !== 'undefined')) {
                    _context.next = 38;
                    break;
                  }
                  _context.prev = 24;
                  utf16DeflatedLogs = pako.deflate(formattedLogs, {
                    to: 'string'
                  });
                  base64DeflatedLogs = btoa(utf16DeflatedLogs);
                  _context.next = 29;
                  return this._psychoJS.serverManager.uploadLog(base64DeflatedLogs, true);
                case 29:
                  return _context.abrupt("return", _context.sent);
                case 32:
                  _context.prev = 32;
                  _context.t1 = _context["catch"](24);
                  console.error('log compression error:', _context.t1);
                  throw Object.assign(response, {
                    error: _context.t1
                  });
                case 36:
                  _context.next = 41;
                  break;
                case 38:
                  _context.next = 40;
                  return this._psychoJS.serverManager.uploadLog(formattedLogs, false);
                case 40:
                  return _context.abrupt("return", _context.sent);
                case 41:
                  _context.next = 44;
                  break;
                case 43:
                  this._psychoJS.logger.debug('\n' + formattedLogs);
                case 44:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[6, 10, 14, 22], [15,, 17, 21], [24, 32]]);
        }));
        function flush() {
          return _flush.apply(this, arguments);
        }
        return flush;
      }()
    }, {
      key: "_customConsoleLayout",
      value: function _customConsoleLayout() {
        var customLayout = new log4javascript.PatternLayout("%p %f{1} | %m");
        customLayout.setCustomField('location', function (layout, loggingReference) {
          try {
            throw Error('fake exception');
          } catch (e) {
            var stackEntries = e.stack.replace(/^.*?\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anon}(').split("\n");
            var relevantEntry;
            var browser = util$1.detectBrowser();
            if (browser === 'Firefox') {
              var _iteratorNormalCompletion2 = true;
              var _didIteratorError2 = false;
              var _iteratorError2 = undefined;
              try {
                for (var _iterator2 = stackEntries[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  var entry = _step2.value;
                  if (entry.indexOf('log4javascript.min.js') <= 0) {
                    relevantEntry = entry;
                    break;
                  }
                }
              } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                    _iterator2["return"]();
                  }
                } finally {
                  if (_didIteratorError2) {
                    throw _iteratorError2;
                  }
                }
              }
              var buf = relevantEntry.split(':');
              var line = buf[buf.length - 2];
              var file = buf[buf.length - 3].split('/').pop();
              var method = relevantEntry.split('@')[0];
              return method + ' ' + file + ' ' + line;
            } else if (browser === 'Safari') {
              return 'unknown';
            } else if (browser === 'Chrome') {
              relevantEntry = stackEntries.pop();
              var _buf = relevantEntry.split(' ');
              var fileLine = _buf.pop();
              var _method = _buf.pop();
              _buf = fileLine.split(':');
              _buf.pop();
              var _line = _buf.pop();
              var _file = _buf.pop().split('/').pop();
              return _method + ' ' + _file + ' ' + _line;
            } else return 'unknown';
          }
        });
        return customLayout;
      }
    }]);
    return Logger;
  }();
  Logger.ServerLevel = {
    CRITICAL: Symbol["for"]('CRITICAL'),
    ERROR: Symbol["for"]('ERROR'),
    WARNING: Symbol["for"]('WARNING'),
    DATA: Symbol["for"]('DATA'),
    EXP: Symbol["for"]('EXP'),
    INFO: Symbol["for"]('INFO'),
    DEBUG: Symbol["for"]('DEBUG'),
    NOTSET: Symbol["for"]('NOTSET')
  };

  var Window =
  function (_PsychObject) {
    _inherits(Window, _PsychObject);
    _createClass(Window, [{
      key: "monitorFramePeriod",
      get: function get() {
        return this._monitorFramePeriod;
      }
    }]);
    function Window() {
      var _this2 = this;
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          name = _ref.name,
          _ref$fullscr = _ref.fullscr,
          fullscr = _ref$fullscr === void 0 ? false : _ref$fullscr,
          _ref$color = _ref.color,
          color = _ref$color === void 0 ? new Color_js.Color('black') : _ref$color,
          _ref$units = _ref.units,
          units = _ref$units === void 0 ? 'pix' : _ref$units,
          _ref$waitBlanking = _ref.waitBlanking,
          waitBlanking = _ref$waitBlanking === void 0 ? false : _ref$waitBlanking,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? true : _ref$autoLog;
      _classCallCheck(this, Window);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Window).call(this, psychoJS, name));
      _this._msgToBeLogged = [];
      _this._drawList = [];
      _this._addAttributes(Window, fullscr, color, units, waitBlanking, autoLog);
      _this._addAttribute('size', []);
      _this._setupPixi();
      _this._monitorFramePeriod = 1.0 / _this.getActualFrameRate();
      _this._frameCount = 0;
      _this._flipCallbacks = [];
      _this._windowAlreadyInFullScreen = false;
      var self = _assertThisInitialized(_this);
      document.addEventListener('fullscreenchange', function (event) {
        _newArrowCheck(this, _this2);
        self._windowAlreadyInFullScreen = !!document.fullscreenElement;
        console.log('windowAlreadyInFullScreen:', self._windowAlreadyInFullScreen);
        self._needUpdate = true;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = self._drawList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var stimulus = _step.value;
            stimulus._needUpdate = true;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }.bind(this));
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(Window, [{
      key: "close",
      value: function close() {
        if (!this._renderer) return;
        if (document.body.contains(this._renderer.view)) document.body.removeChild(this._renderer.view);
        if (typeof this._renderer.gl !== 'undefined') {
          var extension = this._renderer.gl.getExtension('WEBGL_lose_context');
          this._renderer.destroy();
          extension.loseContext();
        } else {
          this._renderer.destroy();
        }
        window.removeEventListener('resize', this._resizeCallback);
        window.removeEventListener('orientationchange', this._resizeCallback);
        this._renderer = null;
      }
    }, {
      key: "getActualFrameRate",
      value: function getActualFrameRate() {
        return 60.0;
      }
    }, {
      key: "adjustScreenSize",
      value: function adjustScreenSize() {
        var _this3 = this;
        if (this.fullscr
        ) {
            this._psychoJS.logger.debug('Resizing Window: ', this._name, 'to full screen.');
            if (typeof document.documentElement.requestFullscreen === 'function') {
              document.documentElement.requestFullscreen()["catch"](function () {
                _newArrowCheck(this, _this3);
                this.psychoJS.logger.warn('Unable to go fullscreen.');
              }.bind(this));
            } else if (typeof document.documentElement.mozRequestFullScreen === 'function') document.documentElement.mozRequestFullScreen();else if (typeof document.documentElement.webkitRequestFullscreen === 'function') document.documentElement.webkitRequestFullscreen();else if (typeof document.documentElement.msRequestFullscreen === 'function') document.documentElement.msRequestFullscreen();else this.psychoJS.logger.warn('Unable to go fullscreen.');
          }
      }
    }, {
      key: "closeFullScreen",
      value: function closeFullScreen() {
        var _this4 = this;
        if (this.fullscr) {
          this._psychoJS.logger.debug('Resizing Window: ', this._name, 'back from full screen.');
          if (typeof document.exitFullscreen === 'function') {
            document.exitFullscreen()["catch"](function () {
              _newArrowCheck(this, _this4);
              this.psychoJS.logger.warn('Unable to close fullscreen.');
            }.bind(this));
          } else if (typeof document.mozCancelFullScreen === 'function') document.mozCancelFullScreen();else if (typeof document.webkitExitFullscreen === 'function') document.webkitExitFullscreen();else if (typeof document.msExitFullscreen === 'function') document.msExitFullscreen();else this.psychoJS.logger.warn('Unable to close fullscreen.');
        }
      }
    }, {
      key: "logOnFlip",
      value: function logOnFlip() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            msg = _ref2.msg,
            _ref2$level = _ref2.level,
            level = _ref2$level === void 0 ? Logger.ServerLevel.EXP : _ref2$level,
            obj = _ref2.obj;
        this._msgToBeLogged.push({
          msg: msg,
          level: level,
          obj: obj
        });
      }
    }, {
      key: "callOnFlip",
      value: function callOnFlip(flipCallback) {
        for (var _len = arguments.length, flipCallbackArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          flipCallbackArgs[_key - 1] = arguments[_key];
        }
        this._flipCallbacks.push({
          "function": flipCallback,
          arguments: flipCallbackArgs
        });
      }
    }, {
      key: "render",
      value: function render() {
        if (!this._renderer) return;
        this._frameCount++;
        this._renderer.render(this._rootContainer);
        if (typeof this._renderer.gl !== 'undefined') {
          this._renderer.gl.readPixels(0, 0, 1, 1, this._renderer.gl.RGBA, this._renderer.gl.UNSIGNED_BYTE, new Uint8Array(4));
          if (this._waitBlanking) this._renderer.gl.finish();
        }
        this._writeLogOnFlip();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;
        try {
          for (var _iterator2 = this._flipCallbacks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var callback = _step2.value;
            callback['function'].apply(callback, _toConsumableArray(callback['arguments']));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
        this._flipCallbacks = [];
        this._refresh();
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (this._needUpdate) {
          if (this._renderer) this._renderer.backgroundColor = this._color["int"];
          document.body.style.backgroundColor = this._color.hex;
          this._needUpdate = false;
        }
      }
    }, {
      key: "_refresh",
      value: function _refresh() {
        this._updateIfNeeded();
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;
        try {
          for (var _iterator3 = this._drawList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var stimulus = _step3.value;
            if (stimulus._needUpdate && typeof stimulus._pixi !== 'undefined') {
              this._rootContainer.removeChild(stimulus._pixi);
              stimulus._updateIfNeeded();
              this._rootContainer.addChild(stimulus._pixi);
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
              _iterator3["return"]();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }
    }, {
      key: "_fullRefresh",
      value: function _fullRefresh() {
        this._needUpdate = true;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;
        try {
          for (var _iterator4 = this._drawList[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var stimulus = _step4.value;
            stimulus.refresh();
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
              _iterator4["return"]();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
        this._refresh();
      }
    }, {
      key: "_setupPixi",
      value: function _setupPixi() {
        var _this5 = this;
        this._size[0] = window.innerWidth;
        this._size[1] = window.innerHeight;
        this._renderer = PIXI.autoDetectRenderer(this._size[0], this._size[1], {
          backgroundColor: this.color["int"]
        });
        this._renderer.view.style.transform = 'translatez(0)';
        this._renderer.view.style.position = 'absolute';
        document.body.appendChild(this._renderer.view);
        document.body.style.backgroundColor = this._color.hex;
        this._rootContainer = new PIXI.Container();
        this._rootContainer.interactive = true;
        Window._resizePixiRenderer(this);
        this.psychoJS.eventManager.addMouseListeners(this._renderer);
        this._resizeCallback = function (e) {
          _newArrowCheck(this, _this5);
          Window._resizePixiRenderer(this, e);
          this._fullRefresh();
        }.bind(this);
        window.addEventListener('resize', this._resizeCallback);
        window.addEventListener('orientationchange', this._resizeCallback);
      }
    }, {
      key: "_writeLogOnFlip",
      value: function _writeLogOnFlip() {
        var logTime = Clock_js.MonotonicClock.getReferenceTime();
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;
        try {
          for (var _iterator5 = this._msgToBeLogged[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var entry = _step5.value;
            this._psychoJS.experimentLogger.log(entry.msg, entry.level, logTime, entry.obj);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
              _iterator5["return"]();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
        this._msgToBeLogged = [];
      }
    }], [{
      key: "_resizePixiRenderer",
      value: function _resizePixiRenderer(pjsWindow, event) {
        pjsWindow._psychoJS.logger.debug('resizing Window: ', pjsWindow._name, 'event:', JSON.stringify(event));
        pjsWindow._size[0] = window.innerWidth;
        pjsWindow._size[1] = window.innerHeight;
        pjsWindow._renderer.view.style.width = pjsWindow._size[0] + 'px';
        pjsWindow._renderer.view.style.height = pjsWindow._size[1] + 'px';
        pjsWindow._renderer.view.style.left = '0px';
        pjsWindow._renderer.view.style.top = '0px';
        pjsWindow._renderer.resize(pjsWindow._size[0], pjsWindow._size[1]);
        pjsWindow._rootContainer.position.x = pjsWindow._size[0] / 2.0;
        pjsWindow._rootContainer.position.y = pjsWindow._size[1] / 2.0;
        pjsWindow._rootContainer.scale.y = -1;
      }
    }]);
    return Window;
  }(PsychObject_js.PsychObject);

  var GUI =
  function () {
    _createClass(GUI, [{
      key: "dialogComponent",
      get: function get() {
        return this._dialogComponent;
      }
    }]);
    function GUI(psychoJS) {
      var _this = this;
      _classCallCheck(this, GUI);
      this._psychoJS = psychoJS;
      psychoJS.serverManager.on(ServerManager.Event.RESOURCE, function (signal) {
        _newArrowCheck(this, _this);
        this._onResourceEvents(signal);
      }.bind(this));
      this._dialogScalingFactor = 0;
    }
    _createClass(GUI, [{
      key: "DlgFromDict",
      value: function DlgFromDict(_ref) {
        var _this2 = this;
        var logoUrl = _ref.logoUrl,
            text = _ref.text,
            dictionary = _ref.dictionary,
            title = _ref.title;
        var infoFromUrl = util$1.getUrlParameters();
        this._progressMsg = '&nbsp;';
        this._progressBarMax = 0;
        this._allResourcesDownloaded = false;
        this._requiredKeys = [];
        this._nbSetRequiredKeys = 0;
        this._dialogComponent = {};
        this._dialogComponent.status = PsychoJS.Status.NOT_STARTED;
        var dialogClock = new Clock_js.Clock();
        var self = this;
        return function () {
          var _this3 = this;
          _newArrowCheck(this, _this2);
          var t = dialogClock.getTime();
          if (t >= 0.0 && self._dialogComponent.status === PsychoJS.Status.NOT_STARTED) {
            self._dialogComponent.tStart = t;
            self._dialogComponent.status = PsychoJS.Status.STARTED;
            if (self._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER && typeof self._psychoJS.config.experiment.license !== 'undefined' && self._psychoJS.config.experiment.runMode === 'LICENSE' && typeof self._psychoJS.config.experiment.license.institutionLogo !== 'undefined') {
              logoUrl = self._psychoJS.config.experiment.license.institutionLogo;
            }
            var htmlCode = '<div id="expDialog" title="' + title + '">';
            if (typeof logoUrl === 'string') {
              htmlCode += '<img id="dialog-logo" class="logo" src="' + logoUrl + '">';
            }
            if (typeof text === 'string' && text.length > 0) {
              htmlCode += '<p>' + text + '</p>';
            }
            htmlCode += '<form>';
            var _loop = function _loop(key) {
              var _this4 = this;
              var value = dictionary[key];
              var keyId = key + '_id';
              var inUrl = false;
              var cleanedDictKey = key.trim().toLowerCase();
              infoFromUrl.forEach(function (urlKey, urlValue) {
                _newArrowCheck(this, _this4);
                var cleanedUrlKey = urlKey.trim().toLowerCase();
                if (cleanedUrlKey === cleanedDictKey) {
                  inUrl = true;
                }
              }.bind(this));
              if (!inUrl) {
                htmlCode += '<label for="' + key + '">' + key + '</label>';
                if (key.slice(-1) === '*') self._requiredKeys.push(key);
                if (Array.isArray(value)) {
                  htmlCode += '<select name="' + key + '" id="' + keyId + '" class="text ui-widget-content' + ' ui-corner-all">';
                  if (key.slice(-1) === '*') htmlCode += '<option disabled selected>...</option>';
                  var _iteratorNormalCompletion2 = true;
                  var _didIteratorError2 = false;
                  var _iteratorError2 = undefined;
                  try {
                    for (var _iterator2 = value[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                      var option = _step2.value;
                      htmlCode += '<option>' + option + '</option>';
                    }
                  } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                        _iterator2["return"]();
                      }
                    } finally {
                      if (_didIteratorError2) {
                        throw _iteratorError2;
                      }
                    }
                  }
                  htmlCode += '</select>';
                  $('#' + keyId).selectmenu({
                    classes: {}
                  });
                }
                else
                  htmlCode += '<input type="text" name="' + key + '" id="' + keyId + '" value="' + value + '" class="text ui-widget-content ui-corner-all">';
              }
            };
            for (var key in dictionary) {
              _loop(key);
            }
            htmlCode += '</form>';
            htmlCode += '<hr><div id="progressMsg" class="progress">' + self._progressMsg + '</div>';
            htmlCode += '<div id="progressbar"></div></div>';
            var dialogElement = document.getElementById('root');
            dialogElement.innerHTML = htmlCode;
            if (typeof logoUrl === 'string') {
              $("#dialog-logo").on('load', function () {
                _newArrowCheck(this, _this3);
                self._onDialogOpen('#expDialog')();
              }.bind(this));
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;
            try {
              for (var _iterator = this._requiredKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _key2 = _step.value;
                var keyId = _key2 + '_id';
                var input = document.getElementById(keyId);
                if (input) input.onchange = function (event) {
                  _newArrowCheck(this, _this3);
                  return GUI._onKeyChange(self, event);
                }.bind(this);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                  _iterator["return"]();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
            self._dialogComponent.button = 'Cancel';
            self._estimateDialogScalingFactor();
            var dialogSize = self._getDialogSize();
            $("#expDialog").dialog({
              width: dialogSize[0],
              maxHeight: dialogSize[1],
              autoOpen: true,
              modal: true,
              closeOnEscape: false,
              resizable: false,
              buttons: [{
                id: "buttonOk",
                text: "Ok",
                click: function click() {
                  for (var _key in dictionary) {
                    var input = document.getElementById(_key + "_id");
                    if (input) dictionary[_key] = input.value;
                  }
                  self._dialogComponent.button = 'OK';
                  $("#expDialog").dialog("close");
                  self._psychoJS.window.adjustScreenSize();
                }
              }, {
                id: "buttonCancel",
                text: "Cancel",
                click: function click() {
                  self._dialogComponent.button = 'Cancel';
                  $("#expDialog").dialog("close");
                }
              }],
              open: self._onDialogOpen('#expDialog'),
              close: function close() {
                self._dialogComponent.status = PsychoJS.Status.FINISHED;
              }
            })
            .prev(".ui-dialog-titlebar").css("background", "green");
            self._updateOkButtonStatus();
            self._dialogResize('#expDialog');
            $("#progressbar").progressbar({
              value: self._progressBarCurrentIncrement
            });
            $("#progressbar").progressbar("option", "max", self._progressBarMax);
          }
          if (self._dialogComponent.status === PsychoJS.Status.FINISHED) return Scheduler_js.Scheduler.Event.NEXT;else return Scheduler_js.Scheduler.Event.FLIP_REPEAT;
        }.bind(this);
      }
    }, {
      key: "dialog",
      value: function dialog() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            message = _ref2.message,
            warning = _ref2.warning,
            error = _ref2.error,
            _ref2$showOK = _ref2.showOK,
            showOK = _ref2$showOK === void 0 ? true : _ref2$showOK,
            onOK = _ref2.onOK;
        this.destroyDialog();
        var htmlCode;
        var titleColour;
        if (typeof error !== 'undefined') {
          this._psychoJS.logger.fatal(util$1.toString(error));
          if (!error) error = 'Unspecified JavaScript error';
          var errorCode = null;
          var stackCode = '<ul>';
          while (true) {
            if (_typeof(error) === 'object' && 'errorCode' in error) {
              errorCode = error.errorCode;
            }
            if (_typeof(error) === 'object' && 'context' in error) {
              stackCode += '<li>' + error.context + '</li>';
              error = error.error;
            } else {
              stackCode += '<li><b>' + error + '</b></li>';
              break;
            }
          }
          stackCode += '</ul>';
          if (errorCode) {
            var _error = this._userFriendlyError(errorCode);
            htmlCode = _error.htmlCode;
            titleColour = _error.titleColour;
          } else {
            htmlCode = '<div id="msgDialog" title="Error">';
            htmlCode += '<p class="validateTips">Unfortunately we encountered the following error:</p>';
            htmlCode += stackCode;
            htmlCode += '<p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>';
            htmlCode += '</div>';
            titleColour = 'red';
          }
        }
        else if (typeof message !== 'undefined') {
            htmlCode = '<div id="msgDialog" title="Message">' + '<p class="validateTips">' + message + '</p>' + '</div>';
            titleColour = 'green';
          }
          else if (typeof warning !== 'undefined') {
              htmlCode = '<div id="msgDialog" title="Warning">' + '<p class="validateTips">' + warning + '</p>' + '</div>';
              titleColour = 'orange';
            }
        var dialogElement = document.getElementById('root');
        dialogElement.innerHTML = htmlCode;
        this._estimateDialogScalingFactor();
        var dialogSize = this._getDialogSize();
        var self = this;
        $('#msgDialog').dialog({
          dialogClass: 'no-close',
          width: dialogSize[0],
          maxHeight: dialogSize[1],
          autoOpen: true,
          modal: true,
          closeOnEscape: false,
          buttons: !showOK ? [] : [{
            id: "buttonOk",
            text: "Ok",
            click: function click() {
              $(this).dialog("close");
              if (typeof onOK !== 'undefined') onOK();
            }
          }],
          open: self._onDialogOpen('#msgDialog')
        })
        .prev(".ui-dialog-titlebar").css("background", titleColour);
        self._dialogResize('#msgDialog');
      }
    }, {
      key: "_onDialogOpen",
      value: function _onDialogOpen(dialogId) {
        var _this5 = this;
        var self = this;
        return function () {
          _newArrowCheck(this, _this5);
          var windowSize = [$(window).width(), $(window).height()];
          var parent = $(dialogId).parent();
          parent.css({
            position: 'absolute',
            left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
            top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0)
          });
          self._contentDelta = [parent.css('width').slice(0, -2) - $(dialogId).css('width').slice(0, -2), parent.css('height').slice(0, -2) - $(dialogId).css('height').slice(0, -2)];
        }.bind(this);
      }
    }, {
      key: "_dialogResize",
      value: function _dialogResize(dialogId) {
        var self = this;
        $(window).resize(function () {
          var parent = $(dialogId).parent();
          var windowSize = [$(window).width(), $(window).height()];
          var dialogSize = self._getDialogSize();
          parent.css({
            width: dialogSize[0],
            maxHeight: dialogSize[1]
          });
          var isDifferent = self._estimateDialogScalingFactor();
          if (!isDifferent) {
            $(dialogId).css({
              width: dialogSize[0] - self._contentDelta[0],
              maxHeight: dialogSize[1] - self._contentDelta[1]
            });
          }
          parent.css({
            position: 'absolute',
            left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
            top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0)
          });
        });
      }
    }, {
      key: "destroyDialog",
      value: function destroyDialog() {
        if ($("#expDialog").length) {
          $("#expDialog").dialog("destroy");
        }
        if ($("#msgDialog").length) {
          $("#msgDialog").dialog("destroy");
        }
      }
    }, {
      key: "_onResourceEvents",
      value: function _onResourceEvents(signal) {
        this._psychoJS.logger.debug('signal: ' + util$1.toString(signal));
        if (signal.message === ServerManager.Event.RESOURCES_REGISTERED) {
          this._progressBarMax = signal.count * 2;
          $("#progressbar").progressbar("option", "max", this._progressBarMax);
          this._progressBarCurrentIncrement = 0;
          $("#progressMsg").text('all resources registered.');
        }
        else if (signal.message === ServerManager.Event.DOWNLOAD_COMPLETED) {
            this._allResourcesDownloaded = true;
            $("#progressMsg").text('all resources downloaded.');
            this._updateOkButtonStatus();
          }
          else if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCE || signal.message === ServerManager.Event.RESOURCE_DOWNLOADED) {
              if (typeof this._progressBarCurrentIncrement === 'undefined') this._progressBarCurrentIncrement = 0;
              ++this._progressBarCurrentIncrement;
              if (signal.message === ServerManager.Event.RESOURCE_DOWNLOADED) $("#progressMsg").text('downloaded ' + this._progressBarCurrentIncrement / 2 + ' / ' + this._progressBarMax / 2);
              $("#progressbar").progressbar("option", "value", this._progressBarCurrentIncrement);
            }
            else $("#progressMsg").text(signal.message);
      }
    }, {
      key: "_updateOkButtonStatus",
      value: function _updateOkButtonStatus() {
        var _this6 = this;
        if (this._psychoJS.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.LOCAL || this._allResourcesDownloaded && this._nbSetRequiredKeys >= this._requiredKeys.length) {
          $("#buttonOk").button("option", "disabled", false);
        } else $("#buttonOk").button("option", "disabled", true);
        $("#buttonOk").hide(0, function () {
          _newArrowCheck(this, _this6);
          $("#buttonOk").show();
        }.bind(this));
      }
    }, {
      key: "_estimateDialogScalingFactor",
      value: function _estimateDialogScalingFactor() {
        var windowSize = [$(window).width(), $(window).height()];
        var dialogScalingFactor = 1.0;
        if (windowSize[0] < 1080) {
          if (windowSize[0] > windowSize[1]) dialogScalingFactor = 1.5;
          else dialogScalingFactor = 2.0;
        }
        var isDifferent = dialogScalingFactor !== this._dialogScalingFactor;
        this._dialogScalingFactor = dialogScalingFactor;
        return isDifferent;
      }
    }, {
      key: "_getDialogSize",
      value: function _getDialogSize() {
        var windowSize = [$(window).width(), $(window).height()];
        this._estimateDialogScalingFactor();
        return [Math.min(GUI.dialogMaxSize[0], (windowSize[0] - GUI.dialogMargin[0]) / this._dialogScalingFactor), Math.min(GUI.dialogMaxSize[1], (windowSize[1] - GUI.dialogMargin[1]) / this._dialogScalingFactor)];
      }
    }, {
      key: "_userFriendlyError",
      value: function _userFriendlyError(errorCode) {
        switch (errorCode) {
          case 1:
            return {
              htmlCode: '<div id="msgDialog" title="Error"><p>Oops we encountered an internal server error.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>',
              titleColour: 'red'
            };
          case 2:
            return {
              htmlCode: '<div id="msgDialog" title="Error"><p>Oops we encountered a database error.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>',
              titleColour: 'red'
            };
          case 20:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> does not have any status and cannot be run.</p><p>If you are the experiment designer, go to your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p></div>"),
              titleColour: 'orange'
            };
          case 21:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> is currently inactive and cannot be run.</p><p>If you are the experiment designer, go to your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p></div>"),
              titleColour: 'orange'
            };
          case 22:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> has been deleted and cannot be run.</p><p>If you are the experiment designer, either go to your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a> and change the experiment status to either PILOTING or RUNNING, or generate a new experiment.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been deleted and cannot be run any longer.</p></div>"),
              titleColour: 'orange'
            };
          case 23:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> has been archived and cannot be run.</p><p>If you are the experiment designer, go to your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been archived and cannot be run at the moment.</p></div>"),
              titleColour: 'orange'
            };
          case 30:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> is currently in PILOTING mode but the pilot token is missing from the URL.</p><p>If you are the experiment designer, you can pilot it by pressing the pilot button on your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p></div>"),
              titleColour: 'orange'
            };
          case 31:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> cannot be run because the pilot token in the URL is invalid, possibly because it has expired.</p><p>If you are the experiment designer, you can generate a new token by pressing the pilot button on your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p></div>"),
              titleColour: 'orange'
            };
          case 50:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> is covered by a license that has expired. </p><p>If you are the experiment designer, you can either contact the license manager to inquire about the expiration, or you can run your experiments using credits. You will find all relevant details about the license on your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a>, where you will also be able to change its running mode to CREDIT.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license having expired.</p></div>"),
              titleColour: 'orange'
            };
          case 51:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> is covered by a license that requires one or more documents to be approved before the experiment can be run. </p><p>If you are the experiment designer, please contact the license manager and ask him or her which documents must be approved. You will find all relevant details about the license on your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license requiring documents to be approved.</p></div>"),
              titleColour: 'orange'
            };
          case 60:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Warning\"><p><strong>".concat(this._psychoJS.config.experiment.fullpath, "</strong> does not have any assigned credit left and cannot be run.</p><p>If you are the experiment designer, you can assign more credits to it on your <a href=\"https://pavlovia.org/").concat(this._psychoJS.config.experiment.fullpath, "\">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment requires more assigned credits to run.</p></div>"),
              titleColour: 'orange'
            };
          default:
            return {
              htmlCode: "<div id=\"msgDialog\" title=\"Error\"><p>Unfortunately we encountered an unspecified error (error code: ".concat(errorCode, ".</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p></div>"),
              titleColour: 'red'
            };
        }
      }
    }], [{
      key: "_onKeyChange",
      value: function _onKeyChange(gui, event) {
        var element = event.target;
        var value = element.value;
        if (typeof value !== 'undefined' && value.length > 0) gui._nbSetRequiredKeys++;else gui._nbSetRequiredKeys--;
        gui._updateOkButtonStatus();
      }
    }]);
    return GUI;
  }();
  GUI.dialogMaxSize = [500, 600];
  GUI.dialogMargin = [50, 50];

  var PsychoJS =
  function () {
    _createClass(PsychoJS, [{
      key: "status",
      get: function get() {
        return this._status;
      },
      set: function set(status) {
        this._status = status;
      }
    }, {
      key: "config",
      get: function get() {
        return this._config;
      }
    }, {
      key: "window",
      get: function get() {
        return this._window;
      }
    }, {
      key: "serverManager",
      get: function get() {
        return this._serverManager;
      }
    }, {
      key: "experiment",
      get: function get() {
        return this._experiment;
      }
    }, {
      key: "scheduler",
      get: function get() {
        return this._scheduler;
      }
    }, {
      key: "monotonicClock",
      get: function get() {
        return this._monotonicClock;
      }
    }, {
      key: "logger",
      get: function get() {
        return this._logger.consoleLogger;
      }
    }, {
      key: "experimentLogger",
      get: function get() {
        return this._logger;
      }
    }, {
      key: "eventManager",
      get: function get() {
        return this._eventManager;
      }
    }, {
      key: "gui",
      get: function get() {
        return this._gui;
      }
    }, {
      key: "IP",
      get: function get() {
        return this._IP;
      }
    }, {
      key: "serverMsg",
      get: function get() {
        return this._serverMsg;
      }
    }]);
    function PsychoJS() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$debug = _ref.debug,
          debug = _ref$debug === void 0 ? true : _ref$debug,
          _ref$collectIP = _ref.collectIP,
          collectIP = _ref$collectIP === void 0 ? false : _ref$collectIP,
          _ref$topLevelStatus = _ref.topLevelStatus,
          topLevelStatus = _ref$topLevelStatus === void 0 ? true : _ref$topLevelStatus;
      _classCallCheck(this, PsychoJS);
      this._logger = new Logger(this, debug ? log4javascript.Level.DEBUG : log4javascript.Level.INFO);
      this._captureErrors();
      this._monotonicClock = new Clock_js.MonotonicClock();
      this._eventManager = new EventManager(this);
      this._serverManager = new ServerManager({
        psychoJS: this
      });
      this._gui = new GUI(this);
      this._collectIP = collectIP;
      this._scheduler = new Scheduler_js.Scheduler(this);
      this._window = undefined;
      this._cancellationUrl = undefined;
      this._completionUrl = undefined;
      this._status = PsychoJS.Status.NOT_CONFIGURED;
      if (topLevelStatus) this._makeStatusTopLevel();
      this.logger.info('[PsychoJS] Initialised.');
    }
    _createClass(PsychoJS, [{
      key: "getEnvironment",
      value: function getEnvironment() {
        if (typeof this._config === 'undefined') return undefined;
        return this._config.environment;
      }
    }, {
      key: "openWindow",
      value: function openWindow() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            name = _ref2.name,
            fullscr = _ref2.fullscr,
            color = _ref2.color,
            units = _ref2.units,
            waitBlanking = _ref2.waitBlanking,
            autoLog = _ref2.autoLog;
        this.logger.info('[PsychoJS] Open Window.');
        if (typeof this._window !== 'undefined') throw {
          origin: 'PsychoJS.openWindow',
          context: 'when opening a Window',
          error: 'A Window has already been opened.'
        };
        this._window = new Window({
          psychoJS: this,
          name: name,
          fullscr: fullscr,
          color: color,
          units: units,
          waitBlanking: waitBlanking,
          autoLog: autoLog
        });
      }
    }, {
      key: "setRedirectUrls",
      value: function setRedirectUrls(completionUrl, cancellationUrl) {
        this._completionUrl = completionUrl;
        this._cancellationUrl = cancellationUrl;
      }
    }, {
      key: "schedule",
      value: function schedule(task, args) {
        this.logger.debug('schedule task: ', task.toString().substring(0, 50), '...');
        this._scheduler.add(task, args);
      }
    }, {
      key: "scheduleCondition",
      value: function scheduleCondition(condition, thenScheduler, elseScheduler) {
        this.logger.debug('schedule condition: ', condition.toString().substring(0, 50), '...');
        this._scheduler.addConditional(condition, thenScheduler, elseScheduler);
      }
    }, {
      key: "start",
      value: function () {
        var _start = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee() {
          var _this = this;
          var _ref3,
              _ref3$configURL,
              configURL,
              _ref3$expName,
              expName,
              expInfo,
              _ref3$resources,
              resources,
              response,
              self,
              _args = arguments;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _ref3 = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}, _ref3$configURL = _ref3.configURL, configURL = _ref3$configURL === void 0 ? 'config.json' : _ref3$configURL, _ref3$expName = _ref3.expName, expName = _ref3$expName === void 0 ? 'UNKNOWN' : _ref3$expName, expInfo = _ref3.expInfo, _ref3$resources = _ref3.resources, resources = _ref3$resources === void 0 ? [] : _ref3$resources;
                  this.logger.debug();
                  response = {
                    origin: 'PsychoJS.start',
                    context: 'when starting the experiment'
                  };
                  _context.prev = 3;
                  _context.next = 6;
                  return this._configure(configURL, expName);
                case 6:
                  if (this._collectIP) this._getParticipantIPInfo();else {
                    this._IP = {
                      IP: 'X',
                      hostname: 'X',
                      city: 'X',
                      region: 'X',
                      country: 'X',
                      location: 'X'
                    };
                  }
                  this._experiment = new ExperimentHandler_js.ExperimentHandler({
                    psychoJS: this,
                    extraInfo: expInfo
                  });
                  if (!(this.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER)) {
                    _context.next = 14;
                    break;
                  }
                  _context.next = 11;
                  return this._serverManager.openSession();
                case 11:
                  self = this;
                  window.onbeforeunload = function () {
                    _newArrowCheck(this, _this);
                    self._serverManager.closeSession(false, true);
                    if (typeof self._window !== 'undefined') self._window.close();
                  }.bind(this);
                  window.addEventListener('unload', function (event) {
                    self._serverManager.closeSession(false, true);
                    if (typeof self._window !== 'undefined') self._window.close();
                  });
                case 14:
                  this._serverManager.downloadResources(resources);
                  this.logger.info('[PsychoJS] Start Experiment.');
                  this._scheduler.start();
                  _context.next = 22;
                  break;
                case 19:
                  _context.prev = 19;
                  _context.t0 = _context["catch"](3);
                  this._gui.dialog({
                    error: Object.assign(response, {
                      error: _context.t0
                    })
                  });
                case 22:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[3, 19]]);
        }));
        function start() {
          return _start.apply(this, arguments);
        }
        return start;
      }()
    }, {
      key: "downloadResources",
      value: function () {
        var _downloadResources = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee2() {
          var resources,
              _args2 = arguments;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  resources = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : [];
                  _context2.prev = 1;
                  _context2.next = 4;
                  return this.serverManager.downloadResources(resources);
                case 4:
                  _context2.next = 9;
                  break;
                case 6:
                  _context2.prev = 6;
                  _context2.t0 = _context2["catch"](1);
                  this._gui.dialog({
                    error: Object.assign(response, {
                      error: _context2.t0
                    })
                  });
                case 9:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[1, 6]]);
        }));
        function downloadResources() {
          return _downloadResources.apply(this, arguments);
        }
        return downloadResources;
      }()
    }, {
      key: "importAttributes",
      value: function importAttributes(obj) {
        this.logger.debug('import attributes from: ', util$1.toString(obj));
        if (typeof obj === 'undefined') return;
        for (var attribute in obj) {
          window[attribute] = obj[attribute];
        }
      }
    }, {
      key: "quit",
      value: function () {
        var _quit = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee3() {
          var _this2 = this;
          var _ref4,
              message,
              _ref4$isCompleted,
              isCompleted,
              text,
              self,
              _args3 = arguments;
          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _ref4 = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : {}, message = _ref4.message, _ref4$isCompleted = _ref4.isCompleted, isCompleted = _ref4$isCompleted === void 0 ? false : _ref4$isCompleted;
                  this.logger.info('[PsychoJS] Quit.');
                  this._experiment.experimentEnded = true;
                  this._status = PsychoJS.Status.FINISHED;
                  _context3.prev = 4;
                  this._scheduler.stop();
                  this.gui.dialog({
                    warning: 'Closing the session. Please wait a few moments.',
                    showOK: false
                  });
                  _context3.next = 9;
                  return this._experiment.save();
                case 9:
                  _context3.next = 11;
                  return this._logger.flush();
                case 11:
                  if (!(this.getEnvironment() === ExperimentHandler_js.ExperimentHandler.Environment.SERVER)) {
                    _context3.next = 14;
                    break;
                  }
                  _context3.next = 14;
                  return this._serverManager.closeSession(isCompleted);
                case 14:
                  text = 'Thank you for your patience.<br/><br/>';
                  text += typeof message !== 'undefined' ? message : 'Goodbye!';
                  self = this;
                  this._gui.dialog({
                    message: text,
                    onOK: function onOK() {
                      _newArrowCheck(this, _this2);
                      self._window.close();
                      self._gui.destroyDialog();
                      while (document.body.hasChildNodes()) {
                        document.body.removeChild(document.body.lastChild);
                      }
                      this._window.closeFullScreen();
                      if (isCompleted && typeof self._completionUrl !== 'undefined') window.location = self._completionUrl;else if (!isCompleted && typeof self._cancellationUrl !== 'undefined') window.location = self._cancellationUrl;
                    }.bind(this)
                  });
                  _context3.next = 24;
                  break;
                case 20:
                  _context3.prev = 20;
                  _context3.t0 = _context3["catch"](4);
                  console.error(_context3.t0);
                  this._gui.dialog({
                    error: _context3.t0
                  });
                case 24:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this, [[4, 20]]);
        }));
        function quit() {
          return _quit.apply(this, arguments);
        }
        return quit;
      }()
    }, {
      key: "_configure",
      value: function () {
        var _configure2 = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee4(configURL, name) {
          var _this3 = this;
          var response, experimentUrl, serverResponse;
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  response = {
                    origin: 'PsychoJS.configure',
                    context: 'when configuring PsychoJS for the experiment'
                  };
                  _context4.prev = 1;
                  this.status = PsychoJS.Status.CONFIGURING;
                  experimentUrl = window.location.href;
                  if (!(experimentUrl.indexOf('https://run.pavlovia.org/') === 0 || experimentUrl.indexOf('https://pavlovia.org/run/') === 0)) {
                    _context4.next = 23;
                    break;
                  }
                  _context4.next = 7;
                  return this._serverManager.getConfiguration(configURL);
                case 7:
                  serverResponse = _context4.sent;
                  this._config = serverResponse.config;
                  if ('psychoJsManager' in this._config) {
                    delete this._config.psychoJsManager;
                    this._config.pavlovia = {
                      URL: 'https://pavlovia.org'
                    };
                  }
                  if ('experiment' in this._config) {
                    _context4.next = 12;
                    break;
                  }
                  throw 'missing experiment block in configuration';
                case 12:
                  if ('name' in this._config.experiment) {
                    _context4.next = 14;
                    break;
                  }
                  throw 'missing name in experiment block in configuration';
                case 14:
                  if ('fullpath' in this._config.experiment) {
                    _context4.next = 16;
                    break;
                  }
                  throw 'missing fullpath in experiment block in configuration';
                case 16:
                  if ('pavlovia' in this._config) {
                    _context4.next = 18;
                    break;
                  }
                  throw 'missing pavlovia block in configuration';
                case 18:
                  if ('URL' in this._config.pavlovia) {
                    _context4.next = 20;
                    break;
                  }
                  throw 'missing URL in pavlovia block in configuration';
                case 20:
                  this._config.environment = ExperimentHandler_js.ExperimentHandler.Environment.SERVER;
                  _context4.next = 24;
                  break;
                case 23:
                  this._config = {
                    environment: ExperimentHandler_js.ExperimentHandler.Environment.LOCAL,
                    experiment: {
                      name: name,
                      saveFormat: ExperimentHandler_js.ExperimentHandler.SaveFormat.CSV
                    }
                  };
                case 24:
                  this._serverMsg = new Map();
                  util$1.getUrlParameters().forEach(function (value, key) {
                    _newArrowCheck(this, _this3);
                    if (key.indexOf('__') === 0) this._serverMsg.set(key, value);
                  }.bind(this));
                  this.status = PsychoJS.Status.CONFIGURED;
                  this.logger.debug('configuration:', util$1.toString(this._config));
                  _context4.next = 33;
                  break;
                case 30:
                  _context4.prev = 30;
                  _context4.t0 = _context4["catch"](1);
                  throw Object.assign(response, {
                    error: _context4.t0
                  });
                case 33:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this, [[1, 30]]);
        }));
        function _configure(_x, _x2) {
          return _configure2.apply(this, arguments);
        }
        return _configure;
      }()
    }, {
      key: "_getParticipantIPInfo",
      value: function () {
        var _getParticipantIPInfo2 = _asyncToGenerator(
        regeneratorRuntime.mark(function _callee5() {
          var response, geoResponse, geoData;
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  response = {
                    origin: 'PsychoJS._getParticipantIPInfo',
                    context: 'when getting the IP information of the participant'
                  };
                  this.logger.debug('getting the IP information of the participant');
                  this._IP = {};
                  _context5.prev = 3;
                  _context5.next = 6;
                  return $.get('http://www.geoplugin.net/json.gp');
                case 6:
                  geoResponse = _context5.sent;
                  geoData = JSON.parse(geoResponse);
                  this._IP = {
                    IP: geoData.geoplugin_request,
                    country: geoData.geoplugin_countryName,
                    latitude: geoData.geoplugin_latitude,
                    longitude: geoData.geoplugin_longitude
                  };
                  this.logger.debug('IP information of the participant: ' + util$1.toString(this._IP));
                  _context5.next = 15;
                  break;
                case 12:
                  _context5.prev = 12;
                  _context5.t0 = _context5["catch"](3);
                  throw Object.assign(response, {
                    error: _context5.t0
                  });
                case 15:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5, this, [[3, 12]]);
        }));
        function _getParticipantIPInfo() {
          return _getParticipantIPInfo2.apply(this, arguments);
        }
        return _getParticipantIPInfo;
      }()
    }, {
      key: "_captureErrors",
      value: function _captureErrors() {
        this.logger.debug('capturing all errors using window.onerror');
        var self = this;
        window.onerror = function (message, source, lineno, colno, error) {
          console.error(error);
          self._gui.dialog({
            "error": error
          });
          return true;
        };
      }
    }, {
      key: "_makeStatusTopLevel",
      value: function _makeStatusTopLevel() {
        for (var status in PsychoJS.Status) {
          window[status] = PsychoJS.Status[status];
        }
      }
    }]);
    return PsychoJS;
  }();
  PsychoJS.Status = {
    NOT_CONFIGURED: Symbol["for"]('NOT_CONFIGURED'),
    CONFIGURING: Symbol["for"]('CONFIGURING'),
    CONFIGURED: Symbol["for"]('CONFIGURED'),
    NOT_STARTED: Symbol["for"]('NOT_STARTED'),
    STARTED: Symbol["for"]('STARTED'),
    FINISHED: Symbol["for"]('FINISHED'),
    STOPPED: Symbol["for"]('FINISHED')
  };

  var EventManager =
  function () {
    function EventManager(psychoJS) {
      _classCallCheck(this, EventManager);
      this._psychoJS = psychoJS;
      for (var keyName in EventManager._pygletMap) {
        EventManager._reversePygletMap[EventManager._pygletMap[keyName]] = keyName;
      }
      this._keyBuffer = [];
      this._addKeyListeners();
      this._mouseInfo = {
        pos: [0, 0],
        wheelRel: [0.0, 0.0],
        buttons: {
          pressed: [0, 0, 0],
          clocks: [new Clock_js.Clock(), new Clock_js.Clock(), new Clock_js.Clock()],
          times: [0.0, 0.0, 0.0]
        },
        moveClock: new Clock_js.Clock()
      };
    }
    _createClass(EventManager, [{
      key: "getKeys",
      value: function getKeys() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$keyList = _ref.keyList,
            keyList = _ref$keyList === void 0 ? null : _ref$keyList,
            _ref$timeStamped = _ref.timeStamped,
            timeStamped = _ref$timeStamped === void 0 ? false : _ref$timeStamped;
        if (keyList != null) keyList = EventManager.pyglet2w3c(keyList);
        var newBuffer = [];
        var keys = [];
        for (var i = 0; i < this._keyBuffer.length; ++i) {
          var key = this._keyBuffer[i];
          var keyId = null;
          if (keyList != null) {
            var index = keyList.indexOf(key.code);
            if (index < 0) index = keyList.indexOf(EventManager._keycodeMap[key.keyCode]);
            if (index >= 0) keyId = EventManager._reversePygletMap[keyList[index]];
          } else keyId = EventManager._reversePygletMap[key.code];
          if (keyId != null) {
            if (timeStamped) keys.push([keyId, key.timestamp]);else keys.push(keyId);
          } else newBuffer.push(key);
        }
        this._keyBuffer = newBuffer;
        return keys;
      }
    }, {
      key: "getMouseInfo",
      value: function getMouseInfo() {
        return this._mouseInfo;
      }
    }, {
      key: "clearEvents",
      value: function clearEvents(attribs) {
        this.clearKeys();
      }
    }, {
      key: "clearKeys",
      value: function clearKeys() {
        this._keyBuffer = [];
      }
    }, {
      key: "startMoveClock",
      value: function startMoveClock() {}
    }, {
      key: "stopMoveClock",
      value: function stopMoveClock() {}
    }, {
      key: "resetMoveClock",
      value: function resetMoveClock() {}
    }, {
      key: "addMouseListeners",
      value: function addMouseListeners(renderer) {
        var _this = this;
        var self = this;
        renderer.view.addEventListener("pointerdown", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.buttons.pressed[event.button] = 1;
          self._mouseInfo.buttons.times[event.button] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[event.button].getLastResetTime();
          self._mouseInfo.pos = [event.offsetX, event.offsetY];
          this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
        }.bind(this), false);
        renderer.view.addEventListener("touchstart", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.buttons.pressed[0] = 1;
          self._mouseInfo.buttons.times[0] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[0].getLastResetTime();
          var touches = event.changedTouches;
          self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
          this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
        }.bind(this), false);
        renderer.view.addEventListener("pointerup", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.buttons.pressed[event.button] = 0;
          self._mouseInfo.buttons.times[event.button] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[event.button].getLastResetTime();
          self._mouseInfo.pos = [event.offsetX, event.offsetY];
          this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
        }.bind(this), false);
        renderer.view.addEventListener("touchend", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.buttons.pressed[0] = 0;
          self._mouseInfo.buttons.times[0] = self._psychoJS._monotonicClock.getTime() - self._mouseInfo.buttons.clocks[0].getLastResetTime();
          var touches = event.changedTouches;
          self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
          this._psychoJS.experimentLogger.data("Mouse: " + event.button + " button down, pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
        }.bind(this), false);
        renderer.view.addEventListener("pointermove", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.moveClock.reset();
          self._mouseInfo.pos = [event.offsetX, event.offsetY];
        }.bind(this), false);
        renderer.view.addEventListener("touchmove", function (event) {
          _newArrowCheck(this, _this);
          event.preventDefault();
          self._mouseInfo.moveClock.reset();
          var touches = event.changedTouches;
          self._mouseInfo.pos = [touches[0].pageX, touches[0].pageY];
        }.bind(this), false);
        renderer.view.addEventListener("wheel", function (event) {
          _newArrowCheck(this, _this);
          self._mouseInfo.wheelRel[0] += event.deltaX;
          self._mouseInfo.wheelRel[1] += event.deltaY;
          this._psychoJS.experimentLogger.data("Mouse: wheel shift=(" + event.deltaX + "," + event.deltaY + "), pos=(" + self._mouseInfo.pos[0] + "," + self._mouseInfo.pos[1] + ")");
        }.bind(this), false);
      }
    }, {
      key: "_addKeyListeners",
      value: function _addKeyListeners() {
        var _this2 = this;
        var self = this;
        window.addEventListener("keydown", function (event)
        {
          _newArrowCheck(this, _this2);
          var timestamp = Clock_js.MonotonicClock.getReferenceTime();
          var code = event.code;
          if (typeof code === 'undefined') code = EventManager.keycode2w3c(event.keyCode);
          self._keyBuffer.push({
            code: code,
            key: event.key,
            keyCode: event.keyCode,
            timestamp: timestamp
          });
          self._psychoJS.logger.trace('keydown: ', event.key);
          self._psychoJS.experimentLogger.data('Keydown: ' + event.key);
          event.stopPropagation();
        }.bind(this));
      }
    }], [{
      key: "pyglet2w3c",
      value: function pyglet2w3c(pygletKeyList) {
        var w3cKeyList = [];
        for (var i = 0; i < pygletKeyList.length; i++) {
          if (typeof EventManager._pygletMap[pygletKeyList[i]] === 'undefined') w3cKeyList.push(pygletKeyList[i]);else w3cKeyList.push(EventManager._pygletMap[pygletKeyList[i]]);
        }
        return w3cKeyList;
      }
    }, {
      key: "w3c2pyglet",
      value: function w3c2pyglet(code) {
        if (code in EventManager._reversePygletMap) return EventManager._reversePygletMap[code];else return 'N/A';
      }
    }, {
      key: "keycode2w3c",
      value: function keycode2w3c(keycode) {
        return EventManager._keycodeMap[keycode];
      }
    }]);
    return EventManager;
  }();
  EventManager._keycodeMap = {
    49: "Digit1",
    50: "Digit2",
    51: "Digit3",
    52: "Digit4",
    53: "Digit5",
    54: "Digit6",
    55: "Digit7",
    56: "Digit8",
    57: "Digit9",
    48: "Digit0",
    65: "KeyA",
    66: "KeyB",
    67: "KeyC",
    68: "KeyD",
    69: "KeyE",
    70: "KeyF",
    71: "KeyG",
    72: "KeyH",
    73: "KeyI",
    74: "KeyJ",
    75: "KeyK",
    76: "KeyL",
    77: "KeyM",
    78: "KeyN",
    79: "KeyO",
    80: "KeyP",
    81: "KeyQ",
    82: "KeyR",
    83: "KeyS",
    84: "KeyT",
    85: "KeyU",
    86: "KeyV",
    87: "KeyW",
    88: "KeyX",
    89: "KeyY",
    90: "KeyZ",
    188: "Comma",
    190: "Period",
    186: "Semicolon",
    222: "Quote",
    219: "BracketLeft",
    221: "BracketRight",
    192: "Backquote",
    220: "Backslash",
    189: "Minus",
    187: "Equal",
    144: "NumLock",
    96: "Numpad0",
    97: "Numpad1",
    98: "Numpad2",
    99: "Numpad3",
    100: "Numpad4",
    101: "Numpad5",
    102: "Numpad6",
    103: "Numpad7",
    104: "Numpad8",
    105: "Numpad9",
    107: "NumpadAdd",
    194: "NumpadComma",
    110: "NumpadDecimal",
    111: "NumpadDivide",
    12: "NumpadEqual",
    106: "NumpadMultiply",
    109: "NumpadSubtract",
    13: "Enter",
    16: "ShiftLeft",
    17: "ControlLeft",
    18: "AltLeft",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    27: "Escape",
    32: "Space"
  };
  EventManager._pygletMap = {
    "grave": "Backquote",
    "backslash": "Backslash",
    "backspace": "Backspace",
    "bracketleft": "BracketLeft",
    "bracketright": "BracketRight",
    "comma": "Comma",
    "0": "Digit0",
    "1": "Digit1",
    "2": "Digit2",
    "3": "Digit3",
    "4": "Digit4",
    "5": "Digit5",
    "6": "Digit6",
    "7": "Digit7",
    "8": "Digit8",
    "9": "Digit9",
    "equal": "Equal",
    "a": "KeyA",
    "b": "KeyB",
    "c": "KeyC",
    "d": "KeyD",
    "e": "KeyE",
    "f": "KeyF",
    "g": "KeyG",
    "h": "KeyH",
    "i": "KeyI",
    "j": "KeyJ",
    "k": "KeyK",
    "l": "KeyL",
    "m": "KeyM",
    "n": "KeyN",
    "o": "KeyO",
    "p": "KeyP",
    "q": "KeyQ",
    "r": "KeyR",
    "s": "KeyS",
    "t": "KeyT",
    "u": "KeyU",
    "v": "KeyV",
    "w": "KeyW",
    "x": "KeyX",
    "y": "KeyY",
    "z": "KeyZ",
    "minus": "Minus",
    "period": "Period",
    "apostrophe": "Quote",
    "semicolon": "Semicolon",
    "slash": "Slash",
    "escape": "Escape",
    "loption": "AltLeft",
    "roption": "AltRight",
    "capslock": "CapsLock",
    "lcontrol": "ControlLeft",
    "rcontrol": "ControlRight",
    "return": "Enter",
    "lcommand": "MetaLeft",
    "rcommand": "MetaRight",
    "lshift": "ShiftLeft",
    "rshift": "ShiftRight",
    "space": "Space",
    "tab": "Tab",
    "down": "ArrowDown",
    "left": "ArrowLeft",
    "right": "ArrowRight",
    "up": "ArrowUp",
    "num_0": "Numpad0",
    "num_1": "Numpad1",
    "num_2": "Numpad2",
    "num_3": "Numpad3",
    "num_4": "Numpad4",
    "num_5": "Numpad5",
    "num_6": "Numpad6",
    "num_7": "Numpad7",
    "num_8": "Numpad8",
    "num_9": "Numpad9",
    "num_decimal": "NumpadDecimal",
    "num_enter": "NumpadEnter",
    "num_add": "NumpadAdd",
    "num_subtract": "NumpadSubtract",
    "num_multiply": "NumpadMultiply",
    "num_divide": "NumpadDivide",
    "num_equal": "NumpadEqual",
    "num_numlock": "NumpadNumlock"
  };
  EventManager._reversePygletMap = {};
  var BuilderKeyResponse = function BuilderKeyResponse(psychoJS) {
    _classCallCheck(this, BuilderKeyResponse);
    this._psychoJS = psychoJS;
    this.status = PsychoJS.Status.NOT_STARTED;
    this.keys = [];
    this.corr = 0;
    this.rt = [];
    this.clock = new Clock_js.Clock();
  };

  var KeyPress = function KeyPress(code, tDown, name) {
    _classCallCheck(this, KeyPress);
    this.code = code;
    this.tDown = tDown;
    this.name = typeof name !== 'undefined' ? name : EventManager.w3c2pyglet(code);
    this.duration = undefined;
    this.rt = undefined;
  };
  var Keyboard =
  function (_PsychObject) {
    _inherits(Keyboard, _PsychObject);
    function Keyboard() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          _ref$bufferSize = _ref.bufferSize,
          bufferSize = _ref$bufferSize === void 0 ? 10000 : _ref$bufferSize,
          _ref$waitForStart = _ref.waitForStart,
          waitForStart = _ref$waitForStart === void 0 ? false : _ref$waitForStart,
          clock = _ref.clock,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? false : _ref$autoLog;
      _classCallCheck(this, Keyboard);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Keyboard).call(this, psychoJS));
      if (typeof clock === 'undefined') clock = new Clock_js.Clock();
      _this._addAttributes(Keyboard, bufferSize, waitForStart, clock, autoLog);
      _this._addAttribute('status', waitForStart ? PsychoJS.Status.NOT_STARTED : PsychoJS.Status.STARTED);
      _this.clearEvents();
      _this._addKeyListeners();
      return _this;
    }
    _createClass(Keyboard, [{
      key: "start",
      value: function start() {
        this._status = PsychoJS.Status.STARTED;
      }
    }, {
      key: "stop",
      value: function stop() {
        this._status = PsychoJS.Status.STOPPED;
      }
    }, {
      key: "getEvents",
      value: function getEvents() {
        if (this._bufferLength === 0) return [];
        var filteredEvents = [];
        var bufferWrap = this._bufferLength === this._bufferSize;
        var i = bufferWrap ? this._bufferIndex : -1;
        do {
          i = (i + 1) % this._bufferSize;
          var keyEvent = this._circularBuffer[i];
          if (keyEvent) filteredEvents.push(keyEvent);
        } while (i !== this._bufferIndex);
        return filteredEvents;
      }
    }, {
      key: "getKeys",
      value: function getKeys() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref2$keyList = _ref2.keyList,
            keyList = _ref2$keyList === void 0 ? [] : _ref2$keyList,
            _ref2$waitRelease = _ref2.waitRelease,
            waitRelease = _ref2$waitRelease === void 0 ? true : _ref2$waitRelease,
            _ref2$clear = _ref2.clear,
            clear = _ref2$clear === void 0 ? true : _ref2$clear;
        if (this._bufferLength === 0) return [];
        var keyPresses = [];
        var bufferWrap = this._bufferLength === this._bufferSize;
        var i = bufferWrap ? this._bufferIndex : -1;
        do {
          i = (i + 1) % this._bufferSize;
          var keyEvent = this._circularBuffer[i];
          if (keyEvent && keyEvent.status === Keyboard.KeyStatus.KEY_UP) {
            if (keyList.length === 0 || keyList.includes(keyEvent.pigletKey)) {
              var precedingKeydownIndex = keyEvent.keydownIndex;
              if (typeof precedingKeydownIndex !== 'undefined') {
                var precedingKeydownEvent = this._circularBuffer[precedingKeydownIndex];
                if (precedingKeydownEvent) {
                  var tDown = precedingKeydownEvent.timestamp;
                  var keyPress = new KeyPress(keyEvent.code, tDown, keyEvent.pigletKey);
                  keyPress.rt = tDown - this._clock.getLastResetTime();
                  keyPress.duration = keyEvent.timestamp - precedingKeydownEvent.timestamp;
                  keyPresses.push(keyPress);
                  if (clear) this._circularBuffer[precedingKeydownIndex] = null;
                }
              }
              if (clear) this._circularBuffer[i] = null;
            }
          }
        } while (i !== this._bufferIndex);
        if (!waitRelease) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;
          try {
            for (var _iterator = this._unmatchedKeydownMap.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var unmatchedKeyDownIndex = _step.value;
              var _keyEvent = this._circularBuffer[unmatchedKeyDownIndex];
              if (_keyEvent) {
                if (keyList.length === 0 || keyList.includes(_keyEvent.pigletKey)) {
                  var _tDown = _keyEvent.timestamp;
                  var _keyPress = new KeyPress(_keyEvent.code, _tDown, _keyEvent.pigletKey);
                  _keyPress.rt = _tDown - this._clock.getLastResetTime();
                  keyPresses.push(_keyPress);
                  if (clear) {
                    this._unmatchedKeydownMap["delete"](_keyEvent.code);
                    this._circularBuffer[unmatchedKeyDownIndex] = null;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        if (clear && keyList.length === 0) this.clearEvents();
        return keyPresses;
      }
    }, {
      key: "clearEvents",
      value: function clearEvents() {
        this._circularBuffer = new Array(this._bufferSize);
        this._bufferLength = 0;
        this._bufferIndex = -1;
        this._previousKeydownKey = undefined;
        this._unmatchedKeydownMap = new Map();
      }
    }, {
      key: "_addKeyListeners",
      value: function _addKeyListeners() {
        var _this2 = this;
        this._previousKeydownKey = undefined;
        var self = this;
        window.addEventListener("keydown", function (event)
        {
          _newArrowCheck(this, _this2);
          if (event.repeat) return;
          var timestamp = Clock_js.MonotonicClock.getReferenceTime();
          if (this._status !== PsychoJS.Status.STARTED) return;
          self._previousKeydownKey = event.key;
          var code = event.code;
          if (typeof code === 'undefined') code = EventManager.keycode2w3c(event.keyCode);
          var pigletKey = EventManager.w3c2pyglet(code);
          self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
          self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
          self._circularBuffer[self._bufferIndex] = {
            code: code,
            key: event.key,
            pigletKey: pigletKey,
            status: Keyboard.KeyStatus.KEY_DOWN,
            timestamp: timestamp
          };
          self._unmatchedKeydownMap.set(event.code, self._bufferIndex);
          self._psychoJS.logger.trace('keydown: ', event.key);
          event.stopPropagation();
        }.bind(this));
        window.addEventListener("keyup", function (event)
        {
          _newArrowCheck(this, _this2);
          var timestamp = Clock_js.MonotonicClock.getReferenceTime();
          if (this._status !== PsychoJS.Status.STARTED) return;
          self._previousKeydownKey = undefined;
          var code = event.code;
          if (typeof code === 'undefined') code = EventManager.keycode2w3c(event.keyCode);
          var pigletKey = EventManager.w3c2pyglet(code);
          self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
          self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
          self._circularBuffer[self._bufferIndex] = {
            code: code,
            key: event.key,
            pigletKey: pigletKey,
            status: Keyboard.KeyStatus.KEY_UP,
            timestamp: timestamp
          };
          var correspondingKeydownIndex = self._unmatchedKeydownMap.get(event.code);
          if (typeof correspondingKeydownIndex !== 'undefined') {
            self._circularBuffer[self._bufferIndex].keydownIndex = correspondingKeydownIndex;
            self._unmatchedKeydownMap["delete"](event.code);
          }
          self._psychoJS.logger.trace('keyup: ', event.key);
          event.stopPropagation();
        }.bind(this));
      }
    }], [{
      key: "includes",
      value: function includes(keypressList, keyName) {
        var _this3 = this;
        if (!Array.isArray(keypressList)) {
          return false;
        }
        var value = keypressList.find(function (keypress) {
          _newArrowCheck(this, _this3);
          return keypress.name === keyName;
        }.bind(this));
        return typeof value !== 'undefined';
      }
    }]);
    return Keyboard;
  }(PsychObject_js.PsychObject);
  Keyboard.KeyStatus = {
    KEY_DOWN: Symbol["for"]('KEY_DOWN'),
    KEY_UP: Symbol["for"]('KEY_UP')
  };

  var MinimalStim =
  function (_PsychObject) {
    _inherits(MinimalStim, _PsychObject);
    function MinimalStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$autoDraw = _ref.autoDraw,
          autoDraw = _ref$autoDraw === void 0 ? false : _ref$autoDraw,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? win.autoLog : _ref$autoLog;
      _classCallCheck(this, MinimalStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(MinimalStim).call(this, win._psychoJS, name));
      _this._pixi = undefined;
      _this._addAttributes(MinimalStim, win, autoDraw, autoLog);
      _this._needUpdate = false;
      _this.status = PsychoJS.Status.NOT_STARTED;
      return _this;
    }
    _createClass(MinimalStim, [{
      key: "setAutoDraw",
      value: function setAutoDraw(autoDraw) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'MinimalStim.setAutoDraw',
          context: 'when setting the autoDraw attribute of stimulus: ' + this._name
        };
        this._setAttribute('autoDraw', autoDraw, log);
        var index = this.win._drawList.indexOf(this);
        if (this._autoDraw) {
          if (this.win) {
            if (index < 0) {
              this._updateIfNeeded();
              if (typeof this._pixi === 'undefined') this.psychoJS.logger.warn('the Pixi.js representation of this stimulus is undefined.');
              else {
                  this.win._rootContainer.addChild(this._pixi);
                  this.win._drawList.push(this);
                }
            } else {
              if (this._needUpdate && typeof this._pixi !== 'undefined') {
                this.win._rootContainer.removeChild(this._pixi);
                this._updateIfNeeded();
                this.win._rootContainer.addChild(this._pixi);
              }
            }
          }
          this.status = PsychoJS.Status.STARTED;
        }
        else {
            if (this.win) {
              if (index >= 0) {
                this.win._drawList.splice(index, 1);
                if (typeof this._pixi !== 'undefined') this.win._rootContainer.removeChild(this._pixi);
              }
            }
            this.status = PsychoJS.Status.STOPPED;
          }
      }
    }, {
      key: "draw",
      value: function draw() {
        this._updateIfNeeded();
        if (this.win && this.win._drawList.indexOf(this) < 0 && typeof this._pixi !== 'undefined') {
          this.win._container.addChild(this._pixi);
          this.win._drawList.push(this);
        }
      }
    }, {
      key: "contains",
      value: function contains(object, units) {
        throw {
          origin: 'MinimalStim.contains',
          context: "when determining whether stimulus: ".concat(this._name, " contains object: ").concat(util.toString(object)),
          error: 'this method is abstract and should not be called.'
        };
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        throw {
          origin: 'MinimalStim._updateIfNeeded',
          context: 'when updating stimulus: ' + this._name,
          error: 'this method is abstract and should not be called.'
        };
      }
    }]);
    return MinimalStim;
  }(PsychObject_js.PsychObject);

  var Mouse =
  function (_PsychObject) {
    _inherits(Mouse, _PsychObject);
    function Mouse() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? true : _ref$autoLog;
      _classCallCheck(this, Mouse);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Mouse).call(this, win._psychoJS, name));
      _this._lastPos = undefined;
      _this._prevPos = undefined;
      _this._movedistance = 0.0;
      var units = win.units;
      var visible = 1;
      _this._addAttributes(Mouse, win, units, visible, autoLog);
      _this.status = PsychoJS.Status.NOT_STARTED;
      return _this;
    }
    _createClass(Mouse, [{
      key: "getPos",
      value: function getPos() {
        var mouseInfo = this.psychoJS.eventManager.getMouseInfo();
        var pos_px = mouseInfo.pos.slice();
        pos_px[0] = pos_px[0] - this.win.size[0] / 2;
        pos_px[1] = this.win.size[1] / 2 - pos_px[1];
        this._lastPos = util$1.to_win(pos_px, 'pix', this._win);
        return this._lastPos;
      }
    }, {
      key: "getRel",
      value: function getRel() {
        if (typeof this._lastPos === 'undefined') return this.getPos();else {
          var lastPos = this._lastPos;
          var pos = this.getPos();
          return [-lastPos[0] + pos[0], -lastPos[1] + pos[1]];
        }
      }
    }, {
      key: "getWheelRel",
      value: function getWheelRel() {
        var mouseInfo = this.psychoJS.eventManager.getMouseInfo();
        var wheelRel_px = mouseInfo.wheelRel.slice();
        var wheelRel = util$1.to_win(wheelRel_px, 'pix', this._win);
        mouseInfo.wheelRel = [0, 0];
        return wheelRel;
      }
    }, {
      key: "getPressed",
      value: function getPressed() {
        var getTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var buttonPressed = this.psychoJS.eventManager.getMouseInfo().buttons.pressed.slice();
        if (!getTime) return buttonPressed;else {
          var buttonTimes = this.psychoJS.eventManager.getMouseInfo().buttons.times.slice();
          return [buttonPressed, buttonTimes];
        }
      }
    }, {
      key: "mouseMoved",
      value: function mouseMoved(distance) {
        var reset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        if (typeof this._lastPos === 'undefined') this.getPos();
        this._prevPos = this._lastPos.slice();
        this.getPos();
        if (typeof reset === 'boolean' && reset == false) {
          if (typeof distance === 'undefined') return this._prevPos[0] != this._lastPos[0] || this._prevPos[1] != this._lastPos[1];else {
            if (typeof distance === 'number') {
              this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
              return this._movedistance > distance;
            }
            if (this._prevPos[0] + distance[0] - this._lastPos[0] > 0.0) return true;
            if (this._prevPos[1] + distance[1] - this._lastPos[0] > 0.0) return true;
            return false;
          }
        } else if (typeof reset === 'boolean' && reset == true) {
          this.psychoJS.eventManager.getMouseInfo().moveClock.reset();
          return false;
        } else if (reset === 'here') {
          this._prevPos = this._lastPos.clone();
          return false;
        } else if (reset instanceof Array) {
          this._prevPos = reset.slice();
          if (!distance) return false;
          else {
              if (typeof distance === 'number') {
                this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
                return this._movedistance > distance;
              }
              if (Math.abs(this._lastPos[0] - this._prevPos[0]) > distance[0]) return true;
              if (Math.abs(this._lastPos[1] - this._prevPos[1]) > distance[1]) return true;
              return false;
            }
        } else return false;
      }
    }, {
      key: "mouseMoveTime",
      value: function mouseMoveTime() {
        return this.psychoJS.eventManager.getMouseInfo().moveClock.getTime();
      }
    }, {
      key: "clickReset",
      value: function clickReset() {
        var buttons = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0, 1, 2];
        var mouseInfo = this.psychoJS.eventManager.getMouseInfo();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = buttons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var b = _step.value;
            mouseInfo.buttons.clocks[b].reset();
            mouseInfo.buttons.times[b] = 0.0;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }]);
    return Mouse;
  }(PsychObject_js.PsychObject);

  var _this = undefined;
  /**
   * Mixin implementing various unit-handling measurement methods.
   *
   * @author Alain Pitiot
   * @version 3.2.5
   * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
   * @license Distributed under the terms of the MIT License
   */
  var WindowMixin = function WindowMixin(superclass) {
    _newArrowCheck(this, _this);
    return (
      function (_superclass) {
        _inherits(_class, _superclass);
        function _class(args) {
          _classCallCheck(this, _class);
          return _possibleConstructorReturn(this, _getPrototypeOf(_class).call(this, args));
        }
        _createClass(_class, [{
          key: "setUnits",
          value: function setUnits() {
            var units = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.win.units;
            var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            this._setAttribute('units', units, log);
          }
        }, {
          key: "_getLengthPix",
          value: function _getLengthPix(length) {
            var response = {
              origin: 'WindowMixin._getLengthPix',
              context: 'when converting a length from stimulus unit to pixel units'
            };
            if (this._units === 'pix') {
              return length;
            } else if (typeof this._units === 'undefined' || this._units === 'norm') {
              var winSize = this.win.size;
              return length * winSize[1] / 2;
            } else if (this._units === 'height') {
              var minSize = Math.min(this.win.size[0], this.win.size[1]);
              return length * minSize;
            } else {
              throw Object.assign(response, {
                error: 'unable to deal with unit: ' + this._units
              });
            }
          }
        }, {
          key: "_getLengthUnits",
          value: function _getLengthUnits(length_px) {
            var response = {
              origin: 'WindowMixin._getLengthUnits',
              context: 'when converting a length from pixel unit to stimulus units'
            };
            if (this._units === 'pix') {
              return length_px;
            } else if (typeof this._units === 'undefined' || this._units === 'norm') {
              var winSize = this.win.size;
              return length_px / (winSize[1] / 2);
            } else if (this._units === 'height') {
              var minSize = Math.min(this.win.size[0], this.win.size[1]);
              return length_px / minSize;
            } else {
              throw Object.assign(response, {
                error: 'unable to deal with unit: ' + this._units
              });
            }
          }
        }, {
          key: "_getHorLengthPix",
          value: function _getHorLengthPix(length) {
            var response = {
              origin: 'WindowMixin._getHorLengthPix',
              context: 'when converting a length from pixel unit to stimulus units'
            };
            if (this._units === 'pix') {
              return length;
            } else if (typeof this._units === 'undefined' || this._units === 'norm') {
              var winSize = this.win.size;
              return length * winSize[0] / 2;
            } else if (this._units === 'height') {
              var minSize = Math.min(this.win.size[0], this.win.size[1]);
              return length * minSize;
            } else {
              throw Object.assign(response, {
                error: 'unable to deal with unit: ' + this._units
              });
            }
          }
        }, {
          key: "_getVerLengthPix",
          value: function _getVerLengthPix(length) {
            var response = {
              origin: 'WindowMixin._getVerLengthPix',
              context: 'when converting a length from pixel unit to stimulus units'
            };
            if (this._units === 'pix') {
              return length;
            } else if (typeof this._units === 'undefined' || this._units === 'norm') {
              var winSize = this.win.size;
              return length * winSize[1] / 2;
            } else if (this._units === 'height') {
              var minSize = Math.min(this.win.size[0], this.win.size[1]);
              return length * minSize;
            } else {
              throw Object.assign(response, {
                error: 'unable to deal with unit: ' + this._units
              });
            }
          }
        }]);
        return _class;
      }(superclass)
    );
  }.bind(undefined);

  exports.BuilderKeyResponse = BuilderKeyResponse;
  exports.EventManager = EventManager;
  exports.GUI = GUI;
  exports.KeyPress = KeyPress;
  exports.Keyboard = Keyboard;
  exports.Logger = Logger;
  exports.MinimalStim = MinimalStim;
  exports.Mouse = Mouse;
  exports.PsychoJS = PsychoJS;
  exports.ServerManager = ServerManager;
  exports.Window = Window;
  exports.WindowMixin = WindowMixin;

  return exports;

}({}, util, util, util, util, data, util));
var visual = (function (exports, MinimalStim_js, WindowMixin_js, util, Color_js, ColorMixin_js, PsychoJS_js, Clock_js) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _newArrowCheck(innerThis, boundThis) {
    if (innerThis !== boundThis) {
      throw new TypeError("Cannot instantiate an arrow function");
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  var VisualStim =
  function (_util$mix$with) {
    _inherits(VisualStim, _util$mix$with);
    function VisualStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          units = _ref.units,
          _ref$ori = _ref.ori,
          ori = _ref$ori === void 0 ? 0.0 : _ref$ori,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$pos = _ref.pos,
          pos = _ref$pos === void 0 ? [0, 0] : _ref$pos,
          size = _ref.size,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, VisualStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(VisualStim).call(this, {
        win: win,
        name: name,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._addAttributes(VisualStim, units, ori, opacity, pos, size);
      _this._needUpdate = true;
      return _this;
    }
    _createClass(VisualStim, [{
      key: "refresh",
      value: function refresh() {
        this._needUpdate = true;
      }
    }, {
      key: "setSize",
      value: function setSize(size) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        if (typeof size !== 'undefined') {
          size = util.toNumerical(size);
          if (!Array.isArray(size)) size = [size, size];
        }
        this._setAttribute('size', size, log);
        this._needUpdate = true;
      }
    }, {
      key: "setOri",
      value: function setOri(ori) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('ori', ori, log);
        var radians = ori * 0.017453292519943295;
        this._rotationMatrix = [[Math.cos(radians), -Math.sin(radians)], [Math.sin(radians), Math.cos(radians)]];
        this._needUpdate = true;
      }
    }, {
      key: "setPos",
      value: function setPos(pos) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('pos', util.toNumerical(pos), log);
        this._needUpdate = true;
      }
    }, {
      key: "setOpacity",
      value: function setOpacity(opacity) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('opacity', opacity, log);
        this._needUpdate = true;
      }
    }]);
    return VisualStim;
  }(util.mix(MinimalStim_js.MinimalStim)["with"](WindowMixin_js.WindowMixin));

  var ImageStim =
  function (_util$mix$with) {
    _inherits(ImageStim, _util$mix$with);
    function ImageStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          image = _ref.image,
          mask = _ref.mask,
          pos = _ref.pos,
          units = _ref.units,
          ori = _ref.ori,
          size = _ref.size,
          _ref$color = _ref.color,
          color = _ref$color === void 0 ? new Color_js.Color('white') : _ref$color,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          _ref$texRes = _ref.texRes,
          texRes = _ref$texRes === void 0 ? 128 : _ref$texRes,
          _ref$depth = _ref.depth,
          depth = _ref$depth === void 0 ? 0 : _ref$depth,
          _ref$interpolate = _ref.interpolate,
          interpolate = _ref$interpolate === void 0 ? false : _ref$interpolate,
          _ref$flipHoriz = _ref.flipHoriz,
          flipHoriz = _ref$flipHoriz === void 0 ? false : _ref$flipHoriz,
          _ref$flipVert = _ref.flipVert,
          flipVert = _ref$flipVert === void 0 ? false : _ref$flipVert,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, ImageStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(ImageStim).call(this, {
        name: name,
        win: win,
        units: units,
        ori: ori,
        opacity: opacity,
        pos: pos,
        size: size,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this.psychoJS.logger.debug('create a new ImageStim with name: ', name);
      _this._addAttributes(ImageStim, image, mask, color, contrast, texRes, interpolate, depth, flipHoriz, flipVert);
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(ImageStim, [{
      key: "setImage",
      value: function setImage(image) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'ImageStim.setImage',
          context: 'when setting the image of ImageStim: ' + this._name
        };
        try {
          if (typeof image === 'undefined') {
            this.psychoJS.logger.warn('setting the image of ImageStim: ' + this._name + ' with argument: undefined.');
            this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: undefined');
          } else {
            if (typeof image === 'string') image = this.psychoJS.serverManager.getResource(image);
            if (!(image instanceof HTMLImageElement)) {
              throw 'the argument: ' + image.toString() + ' is not an image" }';
            }
            this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: src= ' + image.src + ', size= ' + image.width + 'x' + image.height);
          }
          this._setAttribute('image', image, log);
          this._needUpdate = true;
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "setMask",
      value: function setMask(mask) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'ImageStim.setMask',
          context: 'when setting the mask of ImageStim: ' + this._name
        };
        try {
          if (typeof mask === 'undefined') {
            this.psychoJS.logger.warn('setting the mask of ImageStim: ' + this._name + ' with argument: undefined.');
            this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: undefined');
          } else {
            if (typeof mask === 'string') mask = this.psychoJS.serverManager.getResource(mask);
            if (!(mask instanceof HTMLImageElement)) {
              throw 'the argument: ' + mask.toString() + ' is not an image" }';
            }
            this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: src= ' + mask.src + ', size= ' + mask.width + 'x' + mask.height);
          }
          this._setAttribute('mask', mask, log);
          this._needUpdate = true;
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "setFlipVert",
      value: function setFlipVert(flipVert) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('flipVert', flipVert, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFlipHoriz",
      value: function setFlipHoriz(flipHoriz) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('flipHoriz', flipHoriz, log);
        this._needUpdate = true;
      }
    }, {
      key: "contains",
      value: function contains(object, units) {
        if (typeof this._image === 'undefined') return false;
        var objectPos_px = util.getPositionFromObject(object, units);
        if (typeof objectPos_px === 'undefined') throw {
          origin: 'ImageStim.contains',
          context: 'when determining whether ImageStim: ' + this._name + ' contains object: ' + util.toString(object),
          error: 'unable to determine the position of the object'
        };
        var pos_px = util.to_px(this.pos, this.units, this._win);
        var displaySize = this._getDisplaySize();
        var size_px = util.to_px(displaySize, this.units, this._win);
        var polygon_px = [[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2], [pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];
        return util.IsPointInsidePolygon(objectPos_px, polygon_px);
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._pixi = undefined;
        if (typeof this._image === 'undefined') return;
        this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image));
        this._pixi = new PIXI.Sprite(this._texture);
        this._pixi.zOrder = this.depth;
        if (typeof this._mask !== 'undefined') {
          this._maskTexture = new PIXI.Texture(new PIXI.BaseTexture(this._mask));
          this._pixi.mask = new PIXI.Sprite(this._maskTexture);
          this._pixi.mask.anchor.x = 0.5;
          this._pixi.mask.anchor.y = 0.5;
          this._pixi.addChild(this._pixi.mask);
        }
        if (this._texture.width === 0) {
          this._needUpdate = true;
          return;
        }
        this._pixi.alpha = this.opacity;
        var displaySize = this._getDisplaySize();
        var size_px = util.to_px(displaySize, this.units, this.win);
        var scaleX = size_px[0] / this._texture.width;
        var scaleY = size_px[1] / this._texture.height;
        this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
        this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;
        this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
        this._pixi.rotation = this.ori * Math.PI / 180;
        this._pixi.anchor.x = 0.5;
        this._pixi.anchor.y = 0.5;
      }
    }, {
      key: "_getDisplaySize",
      value: function _getDisplaySize() {
        var displaySize = this.size;
        if (typeof displaySize === 'undefined') {
          var textureSize = [this._texture.width, this._texture.height];
          displaySize = util.to_unit(textureSize, 'pix', this.win, this.units);
        }
        return displaySize;
      }
    }]);
    return ImageStim;
  }(util.mix(VisualStim)["with"](ColorMixin_js.ColorMixin));

  var MovieStim =
  function (_VisualStim) {
    _inherits(MovieStim, _VisualStim);
    function MovieStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          movie = _ref.movie,
          pos = _ref.pos,
          units = _ref.units,
          ori = _ref.ori,
          size = _ref.size,
          _ref$color = _ref.color,
          color = _ref$color === void 0 ? new Color_js.Color('white') : _ref$color,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          _ref$interpolate = _ref.interpolate,
          interpolate = _ref$interpolate === void 0 ? false : _ref$interpolate,
          _ref$flipHoriz = _ref.flipHoriz,
          flipHoriz = _ref$flipHoriz === void 0 ? false : _ref$flipHoriz,
          _ref$flipVert = _ref.flipVert,
          flipVert = _ref$flipVert === void 0 ? false : _ref$flipVert,
          _ref$loop = _ref.loop,
          loop = _ref$loop === void 0 ? false : _ref$loop,
          _ref$volume = _ref.volume,
          volume = _ref$volume === void 0 ? 1.0 : _ref$volume,
          _ref$noAudio = _ref.noAudio,
          noAudio = _ref$noAudio === void 0 ? false : _ref$noAudio,
          _ref$autoPlay = _ref.autoPlay,
          autoPlay = _ref$autoPlay === void 0 ? true : _ref$autoPlay,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, MovieStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(MovieStim).call(this, {
        name: name,
        win: win,
        units: units,
        ori: ori,
        opacity: opacity,
        pos: pos,
        size: size,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this.psychoJS.logger.debug('create a new MovieStim with name: ', name);
      _this._addAttributes(MovieStim, movie, color, contrast, interpolate, flipHoriz, flipVert, loop, volume, noAudio, autoPlay);
      var videoElement = document.createElement('video');
      _this._hasFastSeek = typeof videoElement.fastSeek === 'function';
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(MovieStim, [{
      key: "setMovie",
      value: function setMovie(movie) {
        var _this2 = this;
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'MovieStim.setMovie',
          context: 'when setting the movie of MovieStim: ' + this._name
        };
        try {
          if (typeof movie === 'undefined') {
            this.psychoJS.logger.warn('setting the movie of MovieStim: ' + this._name + ' with argument: undefined.');
            this.psychoJS.logger.debug('set the movie of MovieStim: ' + this._name + ' as: undefined');
          } else {
            if (typeof movie === 'string') movie = this.psychoJS.serverManager.getResource(movie);
            if (!(movie instanceof HTMLVideoElement)) throw 'the argument: ' + movie.toString() + ' is not a video" }';
            this.psychoJS.logger.debug("set the movie of MovieStim: ".concat(this._name, " as: src= ").concat(movie.src, ", size= ").concat(movie.videoWidth, "x").concat(movie.videoHeight, ", duration= ").concat(movie.duration, "s"));
          }
          this._setAttribute('movie', movie, log);
          this._movie.onended = function () {
            _newArrowCheck(this, _this2);
            this.status = PsychoJS_js.PsychoJS.Status.FINISHED;
          }.bind(this);
          this._needUpdate = true;
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('volume', volume, log);
        this._needUpdate = true;
      }
    }, {
      key: "setNoAudio",
      value: function setNoAudio(noAudio) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('noAudio', noAudio, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFlipVert",
      value: function setFlipVert(flipVert) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('flipVert', flipVert, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFlipHoriz",
      value: function setFlipHoriz(flipHoriz) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('flipHoriz', flipHoriz, log);
        this._needUpdate = true;
      }
    }, {
      key: "reset",
      value: function reset() {
        this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
        this._movie.pause();
        if (this._hasFastSeek) this._movie.fastSeek(0);
      }
    }, {
      key: "play",
      value: function play() {
        this.status = PsychoJS_js.PsychoJS.Status.STARTED;
        this._movie.play();
      }
    }, {
      key: "pause",
      value: function pause() {
        this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
        this._movie.pause();
      }
    }, {
      key: "stop",
      value: function stop() {
        this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
        this._movie.pause();
        if (this._hasFastSeek) this._movie.fastSeek(0);
      }
    }, {
      key: "seek",
      value: function seek(timePoint) {
        if (timePoint < 0 || timePoint > this._movie.duration) {
          throw {
            origin: 'MovieStim.seek',
            context: "when seeking to timepoint: ".concat(timePoint, " of MovieStim: ").concat(this._name),
            error: "the timepoint does not belong to [0, ".concat(this._movie.duration)
          };
        }
        if (this._hasFastSeek) this._movie.fastSeek(timePoint);
      }
    }, {
      key: "contains",
      value: function contains(object, units) {
        var objectPos_px = util.getPositionFromObject(object, units);
        if (typeof objectPos_px === 'undefined') {
          throw {
            origin: 'MovieStim.contains',
            context: "when determining whether MovieStim: ".concat(this._name, " contains object: ").concat(util.toString(object)),
            error: 'unable to determine the position of the object'
          };
        }
        var pos_px = util.to_px(this.pos, this.units, this._win);
        var size_px = util.to_px(this.size, this.units, this._win);
        var polygon_px = [[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2], [pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2], [pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];
        return util.IsPointInsidePolygon(objectPos_px, polygon_px);
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._pixi = undefined;
        if (typeof this._movie === 'undefined') return;
        this._texture = PIXI.Texture.fromVideo(this._movie);
        this._pixi = new PIXI.Sprite(this._texture);
        if (this._texture.width === 0) {
          this._needUpdate = true;
          return;
        }
        this._movie.muted = this._noAudio;
        this._movie.volume = this._volume;
        this._texture.baseTexture.autoPlay = this.autoPlay;
        this._movie.loop = this._loop;
        this._pixi.alpha = this.opacity;
        var stimSize = this.size;
        if (typeof stimSize === 'undefined') {
          var textureSize = [this._texture.width, this._texture.height];
          stimSize = util.to_unit(textureSize, 'pix', this.win, this.units);
        }
        var size_px = util.to_px(stimSize, this.units, this.win);
        var scaleX = size_px[0] / this._texture.width;
        var scaleY = size_px[1] / this._texture.height;
        this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
        this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;
        this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
        this._pixi.rotation = this.ori * Math.PI / 180;
        this._pixi.anchor.x = 0.5;
        this._pixi.anchor.y = 0.5;
      }
    }]);
    return MovieStim;
  }(VisualStim);

  var ShapeStim =
  function (_util$mix$with) {
    _inherits(ShapeStim, _util$mix$with);
    function ShapeStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$lineWidth = _ref.lineWidth,
          lineWidth = _ref$lineWidth === void 0 ? 1.5 : _ref$lineWidth,
          _ref$lineColor = _ref.lineColor,
          lineColor = _ref$lineColor === void 0 ? new Color_js.Color('white') : _ref$lineColor,
          fillColor = _ref.fillColor,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$vertices = _ref.vertices,
          vertices = _ref$vertices === void 0 ? [[-0.5, 0], [0, 0.5], [0.5, 0]] : _ref$vertices,
          _ref$closeShape = _ref.closeShape,
          closeShape = _ref$closeShape === void 0 ? true : _ref$closeShape,
          _ref$pos = _ref.pos,
          pos = _ref$pos === void 0 ? [0, 0] : _ref$pos,
          _ref$size = _ref.size,
          size = _ref$size === void 0 ? 1.0 : _ref$size,
          _ref$ori = _ref.ori,
          ori = _ref$ori === void 0 ? 0.0 : _ref$ori,
          units = _ref.units,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          _ref$depth = _ref.depth,
          depth = _ref$depth === void 0 ? 0 : _ref$depth,
          _ref$interpolate = _ref.interpolate,
          interpolate = _ref$interpolate === void 0 ? true : _ref$interpolate,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, ShapeStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(ShapeStim).call(this, {
        name: name,
        win: win,
        units: units,
        ori: ori,
        opacity: opacity,
        pos: pos,
        size: size,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._pixiPolygon_px = undefined;
      _this._needVertexUpdate = true;
      _this._vertices_px = undefined;
      _this._addAttributes(ShapeStim, lineWidth, lineColor, fillColor, vertices, closeShape, contrast, depth, interpolate);
      return _this;
    }
    _createClass(ShapeStim, [{
      key: "refresh",
      value: function refresh() {
        _get(_getPrototypeOf(ShapeStim.prototype), "refresh", this).call(this);
        this._needVertexUpdate = true;
      }
    }, {
      key: "setSize",
      value: function setSize(size) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        _get(_getPrototypeOf(ShapeStim.prototype), "setSize", this).call(this, size, log);
        this._needVertexUpdate = true;
      }
    }, {
      key: "setLineWidth",
      value: function setLineWidth(lineWidth) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('lineWidth', lineWidth, log);
        this._needUpdate = true;
      }
    }, {
      key: "setLineColor",
      value: function setLineColor(lineColor) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('lineColor', lineColor, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFillColor",
      value: function setFillColor(fillColor) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._setAttribute('fillColor', fillColor, log);
        this._needUpdate = true;
      }
    }, {
      key: "setVertices",
      value: function setVertices(vertices) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var response = {
          origin: 'ShapeStim.setVertices',
          context: 'when setting the vertices of ShapeStim: ' + this._name
        };
        this._psychoJS.logger.debug('set the vertices of ShapeStim:', this.name);
        try {
          if (typeof vertices === 'string') {
            if (vertices in ShapeStim.KnownShapes) vertices = ShapeStim.KnownShapes[vertices];else throw 'unknown shape';
          }
          this._setAttribute('vertices', vertices, log);
          this._needVertexUpdate = true;
          this._needUpdate = true;
        } catch (error) {
          throw Object.assign(response, {
            error: error
          });
        }
      }
    }, {
      key: "contains",
      value: function contains(object, units) {
        var _this2 = this;
        this._psychoJS.logger.debug('test whether BaseShameStim:', this.name, 'contains object: ', 'name' in object ? object.name : object);
        var objectPos_px = util.getPositionFromObject(object, units);
        if (typeof objectPos_px === 'undefined') throw {
          origin: 'ShapeStim.contains',
          context: 'when determining whether BaseShameStim: ' + this._name + ' contains object: ' + util.toString(object),
          error: 'unable to determine the position of the object'
        };
        var pos_px = util.to_px(this.pos, this.units, this.win);
        var polygon_px = this._vertices_px.map(function (v) {
          _newArrowCheck(this, _this2);
          return [v[0] + pos_px[0], v[1] + pos_px[1]];
        }.bind(this));
        return util.IsPointInsidePolygon(objectPos_px, polygon_px);
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._getPolygon();
        this._pixi = undefined;
        if (typeof this._pixiPolygon_px === 'undefined') return;
        this._pixi = new PIXI.Graphics();
        this._pixi.lineStyle(this._lineWidth, this._lineColor["int"], this._opacity, 0.5);
        if (typeof this._fillColor !== 'undefined') this._pixi.beginFill(this._fillColor["int"], this._opacity);
        this._pixi.drawPolygon(this._pixiPolygon_px);
        if (typeof this._fillColor !== 'undefined') this._pixi.endFill();
        this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
        this._pixi.rotation = this.ori * Math.PI / 180.0;
      }
    }, {
      key: "_getPolygon",
      value: function _getPolygon()
      {
        if (!this._needVertexUpdate) return;
        this._needVertexUpdate = false;
        this._getVertices_px();
        var coords_px = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = this._vertices_px[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var vertex_px = _step.value;
            coords_px.push.apply(coords_px, vertex_px);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
        if (coords_px.length >= 6 && this._closeShape) {
          var n = coords_px.length;
          if (coords_px[0] !== coords_px[n - 2] || coords_px[1] !== coords_px[n - 1]) {
            coords_px.push(coords_px[0]);
            coords_px.push(coords_px[1]);
          }
        }
        this._pixiPolygon_px = new PIXI.Polygon(coords_px);
        return this._pixiPolygon_px;
      }
    }, {
      key: "_getVertices_px",
      value: function _getVertices_px()
      {
        var _this3 = this;
        var flip = [1.0, 1.0];
        if ('_flipHoriz' in this && this._flipHoriz) flip[0] = -1.0;
        if ('_flipVert' in this && this._flipVert) flip[1] = -1.0;
        this._vertices_px = this._vertices.map(function (v) {
          _newArrowCheck(this, _this3);
          return util.to_px([v[0] * this._size[0] * flip[0], v[1] * this._size[1] * flip[1]], this._units, this._win);
        }.bind(this));
        return this._vertices_px;
      }
    }]);
    return ShapeStim;
  }(util.mix(VisualStim)["with"](ColorMixin_js.ColorMixin));
  ShapeStim.KnownShapes = {
    cross: [[-0.1, +0.5],
    [+0.1, +0.5], [+0.1, +0.1], [+0.5, +0.1],
    [+0.5, -0.1], [+0.1, -0.1], [+0.1, -0.5],
    [-0.1, -0.5], [-0.1, -0.1], [-0.5, -0.1],
    [-0.5, +0.1], [-0.1, +0.1]],
    star7: [[0.0, 0.5], [0.09, 0.18], [0.39, 0.31], [0.19, 0.04], [0.49, -0.11], [0.16, -0.12], [0.22, -0.45], [0.0, -0.2], [-0.22, -0.45], [-0.16, -0.12], [-0.49, -0.11], [-0.19, 0.04], [-0.39, 0.31], [-0.09, 0.18]]
  };

  var Polygon =
  function (_ShapeStim) {
    _inherits(Polygon, _ShapeStim);
    function Polygon() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$lineWidth = _ref.lineWidth,
          lineWidth = _ref$lineWidth === void 0 ? 1.5 : _ref$lineWidth,
          _ref$lineColor = _ref.lineColor,
          lineColor = _ref$lineColor === void 0 ? new Color_js.Color('white') : _ref$lineColor,
          fillColor = _ref.fillColor,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$edges = _ref.edges,
          edges = _ref$edges === void 0 ? 3 : _ref$edges,
          _ref$radius = _ref.radius,
          radius = _ref$radius === void 0 ? 0.5 : _ref$radius,
          _ref$pos = _ref.pos,
          pos = _ref$pos === void 0 ? [0, 0] : _ref$pos,
          _ref$size = _ref.size,
          size = _ref$size === void 0 ? 1.0 : _ref$size,
          _ref$ori = _ref.ori,
          ori = _ref$ori === void 0 ? 0.0 : _ref$ori,
          units = _ref.units,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          _ref$depth = _ref.depth,
          depth = _ref$depth === void 0 ? 0 : _ref$depth,
          _ref$interpolate = _ref.interpolate,
          interpolate = _ref$interpolate === void 0 ? true : _ref$interpolate,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, Polygon);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Polygon).call(this, {
        name: name,
        win: win,
        lineWidth: lineWidth,
        lineColor: lineColor,
        fillColor: fillColor,
        opacity: opacity,
        pos: pos,
        ori: ori,
        size: size,
        units: units,
        contrast: contrast,
        depth: depth,
        interpolate: interpolate,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._psychoJS.logger.debug('create a new Polygon with name: ', name);
      _this._addAttributes(Polygon, edges, radius);
      _this._updateVertices();
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(Polygon, [{
      key: "setRadius",
      value: function setRadius(radius) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._psychoJS.logger.debug('set the radius of Polygon: ', this.name, 'to: ', radius);
        this._setAttribute('radius', radius, log);
        this._updateVertices();
      }
    }, {
      key: "setEdges",
      value: function setEdges(edges) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._psychoJS.logger.debug('set the edges of Polygon: ', this.name, 'to: ', edges);
        this._setAttribute('edges', Math.round(edges), log);
        this._updateVertices();
      }
    }, {
      key: "_updateVertices",
      value: function _updateVertices() {
        this._psychoJS.logger.debug('update the vertices of Polygon: ', this.name);
        var angle = 2.0 * Math.PI / this._edges;
        var vertices = [];
        for (var v = 0; v < this._edges; ++v) {
          vertices.push([Math.sin(v * angle) * this._radius, Math.cos(v * angle) * this._radius]);
        }
        this.setVertices(vertices);
      }
    }]);
    return Polygon;
  }(ShapeStim);

  var Rect =
  function (_ShapeStim) {
    _inherits(Rect, _ShapeStim);
    function Rect() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$lineWidth = _ref.lineWidth,
          lineWidth = _ref$lineWidth === void 0 ? 1.5 : _ref$lineWidth,
          _ref$lineColor = _ref.lineColor,
          lineColor = _ref$lineColor === void 0 ? new Color_js.Color('white') : _ref$lineColor,
          fillColor = _ref.fillColor,
          _ref$opacity = _ref.opacity,
          opacity = _ref$opacity === void 0 ? 1.0 : _ref$opacity,
          _ref$width = _ref.width,
          width = _ref$width === void 0 ? 0.5 : _ref$width,
          _ref$height = _ref.height,
          height = _ref$height === void 0 ? 0.5 : _ref$height,
          _ref$pos = _ref.pos,
          pos = _ref$pos === void 0 ? [0, 0] : _ref$pos,
          _ref$size = _ref.size,
          size = _ref$size === void 0 ? 1.0 : _ref$size,
          _ref$ori = _ref.ori,
          ori = _ref$ori === void 0 ? 0.0 : _ref$ori,
          units = _ref.units,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          _ref$depth = _ref.depth,
          depth = _ref$depth === void 0 ? 0 : _ref$depth,
          _ref$interpolate = _ref.interpolate,
          interpolate = _ref$interpolate === void 0 ? true : _ref$interpolate,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, Rect);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Rect).call(this, {
        name: name,
        win: win,
        lineWidth: lineWidth,
        lineColor: lineColor,
        fillColor: fillColor,
        opacity: opacity,
        pos: pos,
        ori: ori,
        size: size,
        units: units,
        contrast: contrast,
        depth: depth,
        interpolate: interpolate,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._psychoJS.logger.debug('create a new Rect with name: ', name);
      _this._addAttributes(Rect, width, height);
      _this._updateVertices();
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(Rect, [{
      key: "setWidth",
      value: function setWidth(width) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._psychoJS.logger.debug('set the width of Rect: ', this.name, 'to: ', width);
        this._setAttribute('width', width, log);
        this._updateVertices();
      }
    }, {
      key: "setHeight",
      value: function setHeight(height) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._psychoJS.logger.debug('set the height of Rect: ', this.name, 'to: ', height);
        this._setAttribute('height', height, log);
        this._updateVertices();
      }
    }, {
      key: "_updateVertices",
      value: function _updateVertices() {
        this._psychoJS.logger.debug('update the vertices of Rect: ', this.name);
        var halfWidth = this._width / 2.0;
        var halfHeight = this._height / 2.0;
        this.setVertices([[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [halfWidth, halfHeight], [-halfWidth, halfHeight]]);
      }
    }]);
    return Rect;
  }(ShapeStim);

  var Slider =
  function (_util$mix$with) {
    _inherits(Slider, _util$mix$with);
    function Slider() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          pos = _ref.pos,
          size = _ref.size,
          ori = _ref.ori,
          _ref$units = _ref.units,
          units = _ref$units === void 0 ? 'height' : _ref$units,
          _ref$color = _ref.color,
          color = _ref$color === void 0 ? new Color_js.Color('LightGray') : _ref$color,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          opacity = _ref.opacity,
          _ref$style = _ref.style,
          style = _ref$style === void 0 ? [Slider.Style.RATING] : _ref$style,
          _ref$ticks = _ref.ticks,
          ticks = _ref$ticks === void 0 ? [1, 2, 3, 4, 5] : _ref$ticks,
          _ref$labels = _ref.labels,
          labels = _ref$labels === void 0 ? [] : _ref$labels,
          labelHeight = _ref.labelHeight,
          _ref$granularity = _ref.granularity,
          granularity = _ref$granularity === void 0 ? 0 : _ref$granularity,
          _ref$flip = _ref.flip,
          flip = _ref$flip === void 0 ? false : _ref$flip,
          _ref$readOnly = _ref.readOnly,
          readOnly = _ref$readOnly === void 0 ? false : _ref$readOnly,
          _ref$fontFamily = _ref.fontFamily,
          fontFamily = _ref$fontFamily === void 0 ? 'Helvetica' : _ref$fontFamily,
          _ref$bold = _ref.bold,
          bold = _ref$bold === void 0 ? true : _ref$bold,
          _ref$italic = _ref.italic,
          italic = _ref$italic === void 0 ? false : _ref$italic,
          fontSize = _ref.fontSize,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, Slider);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Slider).call(this, {
        name: name,
        win: win,
        units: units,
        ori: ori,
        opacity: opacity,
        pos: pos,
        size: size,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._needMarkerUpdate = false;
      _this._addAttributes(Slider, ticks, labels, labelHeight, granularity, flip, color, contrast, fontFamily, bold, italic, fontSize, style, readOnly);
      _this._addAttribute('rating', undefined);
      _this._addAttribute('markerPos', undefined);
      _this._addAttribute('history', []);
      _this._addAttribute('lineAspectRatio', 0.01);
      _this._responseClock = new Clock_js.Clock();
      _this._isCategorical = _this._ticks.length === 0;
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(Slider, [{
      key: "contains",
      value: function contains(object, units) {
        var objectPos_px = util.getPositionFromObject(object, units);
        if (typeof objectPos_px === 'undefined') throw {
          origin: 'Slider.contains',
          context: "when determining whether Slider: ".concat(this._name, " contains\n\t\t\tobject: ").concat(util.toString(object)),
          error: 'unable to determine the position of the object'
        };
        return false;
      }
    }, {
      key: "reset",
      value: function reset() {
        this.psychoJS.logger.debug('reset Slider: ', this._name);
        this._markerPos = undefined;
        this._history = [];
        this._rating = undefined;
        this._responseClock.reset();
        this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
        this._needMarkerUpdate = true;
        this._needUpdate = true;
        if (typeof this._marker !== 'undefined') this._marker.alpha = 0;
      }
    }, {
      key: "getRating",
      value: function getRating() {
        var historyLength = this._history.length;
        if (historyLength > 0) return this._history[historyLength - 1]['rating'];else return undefined;
      }
    }, {
      key: "getRT",
      value: function getRT() {
        var historyLength = this._history.length;
        if (historyLength > 0) return this._history[historyLength - 1]['responseTime'];else return undefined;
      }
    }, {
      key: "setFontSize",
      value: function setFontSize(fontSize) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        if (typeof fontSize === 'undefined') {
          fontSize = this._units === 'pix' ? 14 : 0.03;
        }
        var hasChanged = this._setAttribute('fontSize', fontSize, log);
        if (hasChanged) {
          this._needUpdate = true;
          this._needVertexUpdate = true;
        }
      }
    }, {
      key: "setBold",
      value: function setBold() {
        var bold = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var hasChanged = this._setAttribute('bold', bold, log);
        if (hasChanged) {
          this._fontWeight = bold ? 'bold' : 'normal';
          this._needUpdate = true;
          this._needVertexUpdate = true;
        }
      }
    }, {
      key: "setItalic",
      value: function setItalic() {
        var italic = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var hasChanged = this._setAttribute('italic', italic, log);
        if (hasChanged) {
          this._fontStyle = italic ? 'italic' : 'normal';
          this._needUpdate = true;
          this._needVertexUpdate = true;
        }
      }
    }, {
      key: "setReadOnly",
      value: function setReadOnly() {
        var readOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var hasChanged = this._setAttribute('readOnly', readOnly, log);
        if (hasChanged) {
          if (readOnly) this._opacity /= 2.0;else this._opacity *= 2.0;
          this._needUpdate = true;
        }
      }
    }, {
      key: "setMarkerPos",
      value: function setMarkerPos(displayedRating) {
        var previousMarkerPos = this._markerPos;
        this._markerPos = this._granularise(displayedRating);
        if (previousMarkerPos !== this._markerPos) {
          this._needMarkerUpdate = true;
          this._needUpdate = true;
        }
      }
    }, {
      key: "setRating",
      value: function setRating(rating) {
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        rating = this._granularise(rating);
        this._markerPos = rating;
        if (this._isCategorical) rating = this._labels[Math.round(rating)];
        this._setAttribute('rating', rating, log);
      }
    }, {
      key: "_recordRating",
      value: function _recordRating(rating) {
        var responseTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var log = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        if (typeof responseTime === 'undefined') responseTime = this._responseClock.getTime();
        this.setRating(rating, log);
        this._history.push({
          rating: this._rating,
          responseTime: responseTime
        });
        this.psychoJS.logger.debug('record a new rating: ', this._rating, 'with response time: ', responseTime, 'for Slider: ', this._name);
        this._needMarkerUpdate = true;
        this._needUpdate = true;
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._buildSlider();
        this._updateMarker();
        this._pixi.scale.x = this._flipHoriz ? -1 : 1;
        this._pixi.scale.y = this._flipVert ? 1 : -1;
        this._pixi.rotation = this._ori * Math.PI / 180;
        this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
        this._pixi.alpha = this._opacity;
      }
    }, {
      key: "_updateMarker",
      value: function _updateMarker() {
        if (!this._needMarkerUpdate) return;
        this._needMarkerUpdate = false;
        if (typeof this._marker !== 'undefined') {
          if (typeof this._markerPos !== 'undefined') {
            var visibleMarkerPos = this._ratingToPos([this._markerPos]);
            this._marker.position = util.to_pixiPoint(visibleMarkerPos[0], this.units, this.win);
            this._marker.alpha = 1;
          } else this._marker.alpha = 0;
        }
      }
    }, {
      key: "_buildSlider",
      value: function _buildSlider() {
        var _this2 = this;
        if (!this._needVertexUpdate) return;
        this._needVertexUpdate = false;
        this._applyStyle();
        this._pixi = new PIXI.Container();
        this._pixi.interactive = true;
        this._body = new PIXI.Graphics();
        this._body.interactive = true;
        this._pixi.addChild(this._body);
        var barSize_px = util.to_px(this._barSize, this._units, this._win).map(function (v) {
          _newArrowCheck(this, _this2);
          return Math.max(1, v);
        }.bind(this));
        if (this._barLineWidth_px > 0) {
          this._body.lineStyle(this._barLineWidth_px, this._barLineColor["int"], this._opacity, 0.5);
          if (typeof this._barFillColor !== 'undefined') this._body.beginFill(this._barFillColor["int"], this._opacity);
          this._body.drawRect(-barSize_px[0] / 2, -barSize_px[1] / 2, barSize_px[0], barSize_px[1]);
          if (typeof this._barFillColor !== 'undefined') this._body.endFill();
        }
        if (this._isCategorical) {
          this._ticks = _toConsumableArray(Array(this._labels.length)).map(function (_, i) {
            _newArrowCheck(this, _this2);
            return i;
          }.bind(this));
          this._granularity = 1.0;
        }
        var tickPositions = this._ratingToPos(this._ticks);
        var tickPositions_px = tickPositions.map(function (p) {
          _newArrowCheck(this, _this2);
          return util.to_px(p, this._units, this._win);
        }.bind(this));
        this._body.lineStyle(this._barLineWidth_px * 2, this._tickColor["int"], this._opacity, 0.5);
        var tickSize_px = util.to_px(this._tickSize, this._units, this._win);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
        try {
          for (var _iterator = tickPositions_px[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var tickPosition_px = _step.value;
            if (this._tickType === Slider.Shape.LINE) {
              this._body.moveTo(tickPosition_px[0] - tickSize_px[0] / 2, tickPosition_px[1] - tickSize_px[1] / 2);
              this._body.lineTo(tickPosition_px[0] + tickSize_px[0] / 2, tickPosition_px[1] + tickSize_px[1] / 2);
            } else if (this._tickType === Slider.Shape.DISC) {
              this._body.beginFill(this._tickColor["int"], this._opacity);
              this._body.drawCircle(tickPosition_px[0], tickPosition_px[1], Math.max(tickSize_px[0], tickSize_px[1]));
              this._body.endFill();
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
        var eventCaptureRectangle = new PIXI.Graphics();
        eventCaptureRectangle.beginFill(0, 0);
        eventCaptureRectangle.drawRect(-barSize_px[0] / 2 - tickSize_px[0] / 2, -barSize_px[1] / 2 - tickSize_px[1] / 2, barSize_px[0] + tickSize_px[0], barSize_px[1] + tickSize_px[1]);
        eventCaptureRectangle.endFill();
        this._pixi.addChild(eventCaptureRectangle);
        var labelPositions_px = _toConsumableArray(Array(this._labels.length)).map(function (_, i) {
          _newArrowCheck(this, _this2);
          return tickPositions_px[Math.round(i / (this._labels.length - 1) * (this._ticks.length - 1))];
        }.bind(this));
        var fontSize_px = util.to_px([this._fontSize, this._fontSize], this._units, this._win);
        for (var l = 0; l < labelPositions_px.length; ++l) {
          var labelText = new PIXI.Text(this._labels[l], {
            fontFamily: this._fontFamily,
            fontWeight: this._fontWeight,
            fontStyle: this._fontStyle,
            fontSize: Math.round(fontSize_px[0]),
            fill: this._labelColor.hex,
            align: this._labelAlign
          });
          var labelBounds = labelText.getBounds(true);
          labelText.position.x = labelPositions_px[l][0];
          labelText.position.y = labelPositions_px[l][1];
          labelText.anchor.x = this._labelAnchor.x;
          labelText.anchor.y = this._labelAnchor.y;
          if (this._isHorizontal()) {
            if (this._flip) labelText.position.y -= labelBounds.height + tickSize_px[1];else labelText.position.y += tickSize_px[1];
          } else {
            if (this._flip) labelText.position.x += tickSize_px[0];else if (this._labelOri === 0) labelText.position.x -= labelBounds.width + tickSize_px[0];else labelText.position.x -= tickSize_px[0];
          }
          labelText.rotation = (this._ori + this._labelOri) * Math.PI / 180;
          labelText.alpha = this._opacity;
          this._pixi.addChild(labelText);
        }
        var markerSize_px = Math.max.apply(Math, _toConsumableArray(util.to_px(this._markerSize, this._units, this._win)));
        this._marker = new PIXI.Graphics();
        this._marker.alpha = 0;
        this._marker.interactive = true;
        this._pixi.addChild(this._marker);
        if (this._markerType === Slider.Shape.DISC) {
          this._marker.lineStyle(1, this._markerColor["int"], this._opacity, 0.5);
          this._marker.beginFill(this._markerColor["int"], this._opacity);
          this._marker.drawCircle(0, 0, markerSize_px / 2);
          this._marker.endFill();
        } else if (this._markerType === Slider.Shape.TRIANGLE) {
          this._marker.lineStyle(1, this._markerColor["int"], this._opacity, 0.5);
          this._marker.beginFill(this._markerColor["int"], this._opacity);
          this._marker.moveTo(0, 0);
          if (this._isHorizontal()) {
            if (this._flip) {
              this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
              this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
            } else {
              this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
              this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
            }
          } else {
            if (this._flip) {
              this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
              this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
            } else {
              this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
              this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
            }
          }
          this._marker.endFill();
        }
        var self = this;
        self._markerDragging = false;
        this._marker.pointerdown = this._marker.mousedown = this._marker.touchstart = function (event) {
          _newArrowCheck(this, _this2);
          if (event.data.button === 0) self._markerDragging = true;
          event.stopPropagation();
        }.bind(this);
        this._marker.pointerup = this._marker.mouseup = this._marker.touchend = function (event) {
          _newArrowCheck(this, _this2);
          if (self._markerDragging) {
            self._markerDragging = false;
            var mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
            var rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
            self._recordRating(rating);
            event.stopPropagation();
          }
        }.bind(this);
        this._marker.pointerupoutside = this._marker.mouseupoutside = this._marker.touchendoutside = function (event) {
          _newArrowCheck(this, _this2);
          if (self._markerDragging) {
            var mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
            var rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
            self._recordRating(rating);
            self._markerDragging = false;
            event.stopPropagation();
          }
        }.bind(this);
        this._marker.pointermove = function (event) {
          _newArrowCheck(this, _this2);
          if (self._markerDragging) {
            var mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
            var rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
            self.setMarkerPos(rating);
            event.stopPropagation();
          }
        }.bind(this);
        this._pixi.pointerup = this._pixi.mouseup = this._pixi.touchend = function (event) {
          _newArrowCheck(this, _this2);
          var mouseLocalPos_px = event.data.getLocalPosition(self._body);
          var rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
          self._recordRating(rating);
          event.stopPropagation();
        }.bind(this);
      }
    }, {
      key: "_applyStyle",
      value: function _applyStyle() {
        var _this3 = this;
        if (this._isHorizontal()) {
          this._barSize = [this._size[0], 0];
          this._tickSize = [0, this._size[1]];
          this._labelAnchor = new PIXI.Point(0.5, 0);
        } else {
          this._barSize = [0, this._size[1]];
          this._tickSize = [this._size[0], 0];
          this._labelAnchor = new PIXI.Point(0, 0.5);
        }
        this._barLineWidth_px = 1;
        this._barLineColor = this._color;
        this._barFillColor = undefined;
        this._tickType = Slider.Shape.LINE;
        this._tickColor = this._color;
        this._markerColor = new Color_js.Color('red');
        this._markerType = Slider.Shape.DISC;
        this._markerSize = this._tickSize;
        this._labelColor = this._color;
        this._labelAlign = 'center';
        this._labelOri = 0;
        if (this._style.indexOf(Slider.Style.RATING) > -1) ;
        if (this._style.indexOf(Slider.Style.TRIANGLE_MARKER) > -1) {
          this._markerType = Slider.Shape.TRIANGLE;
          this._markerSize = this._markerSize.map(function (s) {
            _newArrowCheck(this, _this3);
            return s * 2;
          }.bind(this));
        }
        if (this._style.indexOf(Slider.Style.SLIDER) > -1) {
          this.psychoJS.logger.warn('"slider" style not implemented!');
        }
        if (this._style.indexOf(Slider.Style.WHITE_ON_BLACK) > -1) {
          this._barLineColor = new Color_js.Color('black');
          this._tickColor = new Color_js.Color('black');
          this._markerColor = new Color_js.Color('white');
          this._labelColor = new Color_js.Color('black');
        }
        if (this._style.indexOf(Slider.Style.LABELS45) > -1) {
          if (this._flip) {
            this._labelAnchor = new PIXI.Point(0, 0.5);
            this._labelAlign = 'left';
          } else {
            this._labelAnchor = new PIXI.Point(1, 0.5);
            this._labelAlign = 'right';
          }
          this._labelOri = -45;
        }
        if (this._style.indexOf(Slider.Style.RADIO) > -1) {
          this._barLineWidth_px = 0;
          this._tickType = Slider.Shape.DISC;
          this._markerColor = this.getContrastedColor(this._tickColor, 0.5);
          this._markerSize.x *= 0.7;
          this._markerSize.y *= 0.7;
        }
      }
    }, {
      key: "_ratingToPos",
      value: function _ratingToPos(ratings) {
        var _this4 = this;
        var range = this._ticks[this._ticks.length - 1] - this._ticks[0];
        if (this._isHorizontal()) return ratings.map(function (v) {
          _newArrowCheck(this, _this4);
          return [((v - this._ticks[0]) / range - 0.5) * this._size[0], 0];
        }.bind(this));else return ratings.map(function (v) {
          _newArrowCheck(this, _this4);
          return [0, (1.0 - (v - this._ticks[0]) / range - 0.5) * this._size[1]];
        }.bind(this));
      }
    }, {
      key: "_posToRating",
      value: function _posToRating(pos_px) {
        var range = this._ticks[this._ticks.length - 1] - this._ticks[0];
        var size_px = util.to_px(this._size, this._units, this._win);
        if (this._isHorizontal()) return (pos_px[0] / size_px[0] + 0.5) * range + this._ticks[0];
        else return (1.0 - (pos_px[1] / size_px[1] + 0.5)) * range + this._ticks[0];
      }
    }, {
      key: "_isHorizontal",
      value: function _isHorizontal() {
        return this._size[0] > this._size[1];
      }
    }, {
      key: "_granularise",
      value: function _granularise(rating) {
        if (typeof rating === 'undefined') return undefined;
        if (this._granularity > 0) rating = Math.round(rating / this._granularity) * this._granularity;
        rating = Math.min(Math.max(this._ticks[0], rating), this._ticks[this._ticks.length - 1]);
        return rating;
      }
    }]);
    return Slider;
  }(util.mix(VisualStim)["with"](ColorMixin_js.ColorMixin));
  Slider.Shape = {
    DISC: Symbol["for"]('DISC'),
    TRIANGLE: Symbol["for"]('TRIANGLE'),
    LINE: Symbol["for"]('LINE'),
    BOX: Symbol["for"]('BOX')
  };
  Slider.Style = {
    RATING: Symbol["for"]('RATING'),
    TRIANGLE_MARKER: Symbol["for"]('TRIANGLE_MARKER'),
    SLIDER: Symbol["for"]('SLIDER'),
    WHITE_ON_BLACK: Symbol["for"]('WHITE_ON_BLACK'),
    LABELS45: Symbol["for"]('LABELS45'),
    RADIO: Symbol["for"]('RADIO')
  };

  var TextStim =
  function (_util$mix$with) {
    _inherits(TextStim, _util$mix$with);
    function TextStim() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$text = _ref.text,
          text = _ref$text === void 0 ? 'Hello World' : _ref$text,
          _ref$font = _ref.font,
          font = _ref$font === void 0 ? 'Arial' : _ref$font,
          pos = _ref.pos,
          _ref$color = _ref.color,
          color = _ref$color === void 0 ? new Color_js.Color('white') : _ref$color,
          opacity = _ref.opacity,
          _ref$contrast = _ref.contrast,
          contrast = _ref$contrast === void 0 ? 1.0 : _ref$contrast,
          units = _ref.units,
          ori = _ref.ori,
          _ref$height = _ref.height,
          height = _ref$height === void 0 ? 0.1 : _ref$height,
          _ref$bold = _ref.bold,
          bold = _ref$bold === void 0 ? false : _ref$bold,
          _ref$italic = _ref.italic,
          italic = _ref$italic === void 0 ? false : _ref$italic,
          _ref$alignHoriz = _ref.alignHoriz,
          alignHoriz = _ref$alignHoriz === void 0 ? 'center' : _ref$alignHoriz,
          _ref$alignVert = _ref.alignVert,
          alignVert = _ref$alignVert === void 0 ? 'center' : _ref$alignVert,
          wrapWidth = _ref.wrapWidth,
          _ref$flipHoriz = _ref.flipHoriz,
          flipHoriz = _ref$flipHoriz === void 0 ? false : _ref$flipHoriz,
          _ref$flipVert = _ref.flipVert,
          flipVert = _ref$flipVert === void 0 ? false : _ref$flipVert,
          autoDraw = _ref.autoDraw,
          autoLog = _ref.autoLog;
      _classCallCheck(this, TextStim);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(TextStim).call(this, {
        name: name,
        win: win,
        units: units,
        ori: ori,
        opacity: opacity,
        pos: pos,
        autoDraw: autoDraw,
        autoLog: autoLog
      }));
      _this._addAttributes(TextStim, text, font, color, contrast, height, bold, italic, alignHoriz, alignVert, wrapWidth, flipHoriz, flipVert);
      if (_this._autoLog) _this._psychoJS.experimentLogger.exp("Created ".concat(_this.name, " = ").concat(_this.toString()));
      return _this;
    }
    _createClass(TextStim, [{
      key: "setText",
      value: function setText(text, log) {
        this._setAttribute('text', text, log);
        this._needUpdate = true;
      }
    }, {
      key: "setAlignHoriz",
      value: function setAlignHoriz(alignHoriz, log) {
        this._setAttribute('alignHoriz', alignHoriz, log);
        this._needUpdate = true;
      }
    }, {
      key: "setWrapWidth",
      value: function setWrapWidth(wrapWidth, log) {
        if (typeof wrapWidth === 'undefined') {
          if (!TextStim._defaultWrapWidthMap.has(this._units)) throw {
            origin: 'TextStim.setWrapWidth',
            context: 'when setting the wrap width of TextStim: ' + this._name,
            error: 'no default wrap width for unit: ' + this._units
          };
          wrapWidth = TextStim._defaultWrapWidthMap.get(this._units);
        }
        this._setAttribute('wrapWidth', wrapWidth, log);
        this._needUpdate = true;
      }
    }, {
      key: "setHeight",
      value: function setHeight(height, log) {
        if (typeof height === 'undefined') {
          if (!TextStim._defaultLetterHeightMap.has(this._units)) throw {
            origin: 'TextStim.setHeight',
            context: 'when setting the height of TextStim: ' + this._name,
            error: 'no default letter height for unit: ' + this._units
          };
          height = TextStim._defaultLetterHeightMap.get(this._units);
        }
        this._setAttribute('height', height, log);
        this._needUpdate = true;
      }
    }, {
      key: "setItalic",
      value: function setItalic(italic, log) {
        this._setAttribute('italic', italic, log);
        this._needUpdate = true;
      }
    }, {
      key: "setBold",
      value: function setBold(bold, log) {
        this._setAttribute('bold', bold, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFlipVert",
      value: function setFlipVert(flipVert, log) {
        this._setAttribute('flipVert', flipVert, log);
        this._needUpdate = true;
      }
    }, {
      key: "setFlipHoriz",
      value: function setFlipHoriz(flipHoriz, log) {
        this._setAttribute('flipHoriz', flipHoriz, log);
        this._needUpdate = true;
      }
    }, {
      key: "contains",
      value: function contains(object, units) {
        var objectPos_px = util.getPositionFromObject(object, units);
        if (typeof objectPos_px === 'undefined') throw {
          origin: 'TextStim.contains',
          context: 'when determining whether TextStim: ' + this._name + ' contains object: ' + util.toString(object),
          error: 'unable to determine the position of the object'
        };
        return false;
      }
    }, {
      key: "_updateIfNeeded",
      value: function _updateIfNeeded() {
        if (!this._needUpdate) return;
        this._needUpdate = false;
        this._heightPix = this._getLengthPix(this._height);
        var fontSize = Math.round(this._heightPix);
        var color = this.getContrastedColor(this._color, this._contrast);
        var font = (this._bold ? 'bold ' : '') + (this._italic ? 'italic ' : '') + fontSize + 'px ' + this._font;
        this._pixi = new PIXI.Text(this._text, {
          font: font,
          fill: color.hex,
          align: this._alignHoriz,
          wordWrap: typeof this._wrapWidth !== 'undefined',
          wordWrapWidth: this._wrapWidth ? this._getHorLengthPix(this._wrapWidth) : 0
        });
        this._pixi.anchor.x = 0.5;
        this._pixi.anchor.y = 0.5;
        this._pixi.scale.x = this._flipHoriz ? -1 : 1;
        this._pixi.scale.y = this._flipVert ? 1 : -1;
        this._pixi.rotation = this._ori * Math.PI / 180;
        this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
        this._pixi.alpha = this._opacity;
        this._size = [this._getLengthUnits(Math.abs(this._pixi.width)), this._getLengthUnits(Math.abs(this._pixi.height))];
      }
    }]);
    return TextStim;
  }(util.mix(VisualStim)["with"](ColorMixin_js.ColorMixin));
  TextStim._defaultLetterHeightMap = new Map([['cm', 1.0], ['deg', 1.0], ['degs', 1.0], ['degFlatPos', 1.0], ['degFlat', 1.0], ['norm', 0.1], ['height', 0.2], ['pix', 20], ['pixels', 20]]);
  TextStim._defaultWrapWidthMap = new Map([['cm', 15.0], ['deg', 15.0], ['degs', 15.0], ['degFlatPos', 15.0], ['degFlat', 15.0], ['norm', 1], ['height', 1], ['pix', 500], ['pixels', 500]]);

  exports.ImageStim = ImageStim;
  exports.MovieStim = MovieStim;
  exports.Polygon = Polygon;
  exports.Rect = Rect;
  exports.ShapeStim = ShapeStim;
  exports.Slider = Slider;
  exports.TextStim = TextStim;
  exports.VisualStim = VisualStim;

  return exports;

}({}, core, core, util, util, util, core, util));
var sound = (function (exports, PsychoJS_js, PsychObject_js) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _newArrowCheck(innerThis, boundThis) {
    if (innerThis !== boundThis) {
      throw new TypeError("Cannot instantiate an arrow function");
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var SoundPlayer =
  function (_PsychObject) {
    _inherits(SoundPlayer, _PsychObject);
    function SoundPlayer(psychoJS) {
      _classCallCheck(this, SoundPlayer);
      return _possibleConstructorReturn(this, _getPrototypeOf(SoundPlayer).call(this, psychoJS));
    }
    _createClass(SoundPlayer, [{
      key: "play",
      value: function play(loops) {
        throw {
          origin: 'SoundPlayer.play',
          context: 'when starting the playback of a sound',
          error: 'this method is abstract and should not be called.'
        };
      }
    }, {
      key: "stop",
      value: function stop() {
        throw {
          origin: 'SoundPlayer.stop',
          context: 'when stopping the playback of a sound',
          error: 'this method is abstract and should not be called.'
        };
      }
    }, {
      key: "getDuration",
      value: function getDuration() {
        throw {
          origin: 'SoundPlayer.getDuration',
          context: 'when getting the duration of the sound',
          error: 'this method is abstract and should not be called.'
        };
      }
    }, {
      key: "setLoops",
      value: function setLoops(loops) {
        throw {
          origin: 'SoundPlayer.setLoops',
          context: 'when setting the number of loops',
          error: 'this method is abstract and should not be called.'
        };
      }
    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        throw {
          origin: 'SoundPlayer.setVolume',
          context: 'when setting the volume of the sound',
          error: 'this method is abstract and should not be called.'
        };
      }
    }], [{
      key: "accept",
      value: function accept(sound) {
        throw {
          origin: 'SoundPlayer.accept',
          context: 'when evaluating whether this player can play a given sound',
          error: 'this method is abstract and should not be called.'
        };
      }
    }]);
    return SoundPlayer;
  }(PsychObject_js.PsychObject);

  var TonePlayer =
  function (_SoundPlayer) {
    _inherits(TonePlayer, _SoundPlayer);
    function TonePlayer() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          _ref$note = _ref.note,
          note = _ref$note === void 0 ? 'C4' : _ref$note,
          _ref$duration_s = _ref.duration_s,
          duration_s = _ref$duration_s === void 0 ? 0.5 : _ref$duration_s,
          _ref$volume = _ref.volume,
          volume = _ref$volume === void 0 ? 1.0 : _ref$volume,
          _ref$loops = _ref.loops,
          loops = _ref$loops === void 0 ? 0 : _ref$loops;
      _classCallCheck(this, TonePlayer);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(TonePlayer).call(this, psychoJS));
      _this._addAttributes(TonePlayer, note, duration_s, volume, loops);
      _this._synthOtions = {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.001,
          decay: 0.001,
          sustain: 1,
          release: 0.001
        }
      };
      _this._synth = new Tone.Synth(_this._synthOtions);
      _this._volumeNode = new Tone.Volume(-60 + volume * 66);
      _this._synth.connect(_this._volumeNode);
      _this._volumeNode.toMaster();
      _this._toneLoop = null;
      return _this;
    }
    _createClass(TonePlayer, [{
      key: "getDuration",
      value: function getDuration() {
        return this.duration_s;
      }
    }, {
      key: "setLoops",
      value: function setLoops(loops) {
        this._loops = loops;
      }
    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        var mute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._volume = volume;
        if (typeof this._volumeNode !== 'undefined') {
          this._volumeNode.mute = mute;
          this._synth.volume.value = -60 + volume * 66;
        }
      }
    }, {
      key: "play",
      value: function play(loops) {
        var _this2 = this;
        if (typeof loops !== 'undefined') this._loops = loops;
        var actualDuration_s = this._duration_s === -1 ? 1000000 : this._duration_s;
        var self = this;
        var callback = function callback() {
          _newArrowCheck(this, _this2);
          self._synth.triggerAttackRelease(self._note, actualDuration_s);
        }.bind(this);
        if (this.loops === 0) this._toneId = Tone.Transport.scheduleOnce(callback, Tone.now());else if (this.loops === -1) this._toneId = Tone.Transport.scheduleRepeat(callback, this.duration_s, Tone.now(), Tone.Infinity);else this._toneId = Tone.Transport.scheduleRepeat(callback, this.duration_s, Tone.now(), this.duration_s * (this._loops + 1));
      }
    }, {
      key: "stop",
      value: function stop() {
        if (this._toneId) Tone.Transport.clear(this._toneId);
      }
    }], [{
      key: "accept",
      value: function accept(sound) {
        var response = {
          origin: 'TonePlayer.accept',
          context: 'when determining whether a given sound can be played using Tone.js'
        };
        if (typeof Tone !== 'undefined' && Tone.Transport.state !== 'started') Tone.Transport.start(Tone.now());
        if ($.isNumeric(sound.value)) {
          if (typeof Tone === 'undefined') throw _objectSpread2({}, response, {
            error: "unable to play the tone since Tone.js is not available"
          });
          return new TonePlayer({
            psychoJS: sound.psychoJS,
            note: sound.value,
            duration_s: sound.secs,
            volume: sound.volume,
            loops: sound.loops
          });
        }
        if (typeof sound.value === 'string') {
          var psychopyToToneMap = new Map();
          for (var _i = 0, _arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; _i < _arr.length; _i++) {
            var _note = _arr[_i];
            psychopyToToneMap.set(_note, _note);
            psychopyToToneMap.set(_note + 'fl', _note + 'b');
            psychopyToToneMap.set(_note + 'sh', _note + '#');
          }
          var note = psychopyToToneMap.get(sound.value);
          if (typeof note !== 'undefined') {
            if (typeof Tone === 'undefined') throw _objectSpread2({}, response, {
              error: "unable to play the tone since Tone.js is not available"
            });
            return new TonePlayer({
              psychoJS: sound.psychoJS,
              note: note + sound.octave,
              duration_s: sound.secs,
              volume: sound.volume,
              loops: sound.loops
            });
          }
        }
        return undefined;
      }
    }]);
    return TonePlayer;
  }(SoundPlayer);

  var TrackPlayer =
  function (_SoundPlayer) {
    _inherits(TrackPlayer, _SoundPlayer);
    function TrackPlayer() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          psychoJS = _ref.psychoJS,
          howl = _ref.howl,
          _ref$startTime = _ref.startTime,
          startTime = _ref$startTime === void 0 ? 0 : _ref$startTime,
          _ref$stopTime = _ref.stopTime,
          stopTime = _ref$stopTime === void 0 ? -1 : _ref$stopTime,
          _ref$stereo = _ref.stereo,
          stereo = _ref$stereo === void 0 ? true : _ref$stereo,
          _ref$volume = _ref.volume,
          volume = _ref$volume === void 0 ? 0 : _ref$volume,
          _ref$loops = _ref.loops,
          loops = _ref$loops === void 0 ? 0 : _ref$loops;
      _classCallCheck(this, TrackPlayer);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(TrackPlayer).call(this, psychoJS));
      _this._addAttributes(TrackPlayer, howl, startTime, stopTime, stereo, loops, volume);
      _this._currentLoopIndex = -1;
      return _this;
    }
    _createClass(TrackPlayer, [{
      key: "getDuration",
      value: function getDuration() {
        return this._howl.duration();
      }
    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        var mute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this._volume = volume;
        this._howl.volume(volume);
        this._howl.mute(mute);
      }
    }, {
      key: "setLoops",
      value: function setLoops(loops) {
        this._loops = loops;
        this._currentLoopIndex = -1;
        if (loops === 0) this._howl.loop(false);else this._howl.loop(true);
      }
    }, {
      key: "play",
      value: function play(loops) {
        var _this2 = this;
        if (typeof loops !== 'undefined') this.setLoops(loops);
        if (loops > 0) {
          var self = this;
          this._howl.on('end', function (event) {
            _newArrowCheck(this, _this2);
            ++this._currentLoopIndex;
            if (self._currentLoopIndex > self._loops) self.stop();else {
              self._howl.seek(self._startTime);
              self._howl.play();
            }
          }.bind(this));
        }
        this._howl.seek(this._startTime);
        this._howl.play();
      }
    }, {
      key: "stop",
      value: function stop() {
        this._howl.stop();
        this._howl.off('end');
      }
    }], [{
      key: "accept",
      value: function accept(sound) {
        if (typeof sound.value === 'string') {
          var howl = sound.psychoJS.serverManager.getResource(sound.value);
          if (typeof howl !== 'undefined') {
            var player = new TrackPlayer({
              psychoJS: sound.psychoJS,
              howl: howl,
              startTime: sound.startTime,
              stopTime: sound.stopTime,
              stereo: sound.stereo,
              loops: sound.loops,
              volume: sound.volume
            });
            return player;
          }
        }
        return undefined;
      }
    }]);
    return TrackPlayer;
  }(SoundPlayer);

  var Sound =
  function (_PsychObject) {
    _inherits(Sound, _PsychObject);
    function Sound() {
      var _this;
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          name = _ref.name,
          win = _ref.win,
          _ref$value = _ref.value,
          value = _ref$value === void 0 ? 'C' : _ref$value,
          _ref$octave = _ref.octave,
          octave = _ref$octave === void 0 ? 4 : _ref$octave,
          _ref$secs = _ref.secs,
          secs = _ref$secs === void 0 ? 0.5 : _ref$secs,
          _ref$startTime = _ref.startTime,
          startTime = _ref$startTime === void 0 ? 0 : _ref$startTime,
          _ref$stopTime = _ref.stopTime,
          stopTime = _ref$stopTime === void 0 ? -1 : _ref$stopTime,
          _ref$stereo = _ref.stereo,
          stereo = _ref$stereo === void 0 ? true : _ref$stereo,
          _ref$volume = _ref.volume,
          volume = _ref$volume === void 0 ? 1.0 : _ref$volume,
          _ref$loops = _ref.loops,
          loops = _ref$loops === void 0 ? 0 : _ref$loops,
          _ref$hamming = _ref.hamming,
          hamming = _ref$hamming === void 0 ? true : _ref$hamming,
          _ref$autoLog = _ref.autoLog,
          autoLog = _ref$autoLog === void 0 ? true : _ref$autoLog;
      _classCallCheck(this, Sound);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(Sound).call(this, win._psychoJS, name));
      _this._player = undefined;
      _this._addAttributes(Sound, win, value, octave, secs, startTime, stopTime, stereo, volume, loops, hamming, autoLog);
      _this._getPlayer();
      _this.status = PsychoJS_js.PsychoJS.Status.NOT_STARTED;
      return _this;
    }
    _createClass(Sound, [{
      key: "play",
      value: function play(loops) {
        this.status = PsychoJS_js.PsychoJS.Status.STARTED;
        this._player.play(loops);
      }
    }, {
      key: "stop",
      value: function stop() {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref2$log = _ref2.log;
        this._player.stop();
        this.status = PsychoJS_js.PsychoJS.Status.STOPPED;
      }
    }, {
      key: "getDuration",
      value: function getDuration() {
        return this._player.getDuration();
      }
    }, {
      key: "setVolume",
      value: function setVolume(volume) {
        var mute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var log = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        this._setAttribute('volume', volume, log);
        if (typeof this._player !== 'undefined') this._player.setVolume(volume, mute);
      }
    }, {
      key: "setLoops",
      value: function setLoops() {
        var loops = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        this._setAttribute('loops', loops, log);
        if (typeof this._player !== 'undefined') this._player.setLoops(loops);
      }
    }, {
      key: "_getPlayer",
      value: function _getPlayer() {
        var _this2 = this;
        var acceptFns = [function (sound) {
          _newArrowCheck(this, _this2);
          return TonePlayer.accept(sound);
        }.bind(this), function (sound) {
          _newArrowCheck(this, _this2);
          return TrackPlayer.accept(sound);
        }.bind(this)];
        for (var _i = 0, _acceptFns = acceptFns; _i < _acceptFns.length; _i++) {
          var acceptFn = _acceptFns[_i];
          this._player = acceptFn(this);
          if (typeof this._player !== 'undefined') return this._player;
        }
        throw {
          origin: 'SoundPlayer._getPlayer',
          context: 'when finding a player for the sound',
          error: 'could not find an appropriate player.'
        };
      }
    }]);
    return Sound;
  }(PsychObject_js.PsychObject);

  exports.Sound = Sound;
  exports.SoundPlayer = SoundPlayer;
  exports.TonePlayer = TonePlayer;
  exports.TrackPlayer = TrackPlayer;

  return exports;

}({}, core, util));

// adding a few top level variables for convenience
// (e.g. this makes it possible to use "return Scheduler.Event.NEXT;" instead of "util.Scheduler.Event.NEXT;")

PsychoJS = core.PsychoJS;
TrialHandler = data.TrialHandler;
Scheduler = util.Scheduler;