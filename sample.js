function loadFile(uri, callback) {
  $.get(uri + "?t=" + Math.random(), function( data ) {
    callback(data);
  }).fail(function(){
    callback(null);
  });
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  if (!shader) {
    console.error('Error creating the shader with shader type: ' + type);
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    console.error('Error while compiling the shader ' + info);
  }
  return shader;
}

function createProgram(gl, vs, fs) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.linkProgram(program);
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    console.error('Error linking the shader: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function createProgramFromURIs(gl, options) {
  loadFile(options.vsURI, function(vs) {
    if (vs) {
      loadFile(options.fsURI, function(fs) {
        if (fs) {
          var program = createProgram(gl, createShader(gl, gl.VERTEX_SHADER, vs), 
                                          createShader(gl, gl.FRAGMENT_SHADER, fs));
          options.onComplete(program);
        }
      });
    }
  });
}

function setupCamera(video, callback) {
  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      {video: true, audio: false},
      function(localMediaStream) {
        video.src = window.URL.createObjectURL(localMediaStream);
        video.play();
        callback(true);
      }, 
      function() {
        console.log('Can not get video stream.');
        callback(false);
      });  
  } else {
    callback(false);
  }
}

$(function() {
  var section = document.querySelector('div.main');
  var args = document.querySelector('div.arguments');
  var image = args.querySelector('img');
  var video = $('video')[0];
  var canvas = $('#webgl-canvas')[0];
  var gl = canvas.getContext('webgl');

  setupCamera(video, function (useVideo) {
    createProgramFromURIs(gl, {
      vsURI: 'shaders/sample.vs',
      fsURI: 'shaders/sample.fs',
      onComplete: function(program) {
        render(program);
      }
    });

    function render(program) {
      gl.useProgram(program);

      var widthLocation = gl.getUniformLocation(program, 'width');
      var heightLocation = gl.getUniformLocation(program, 'height');
      var samplerLocation = gl.getUniformLocation(program, 'sampler0');
      var positionLocation = gl.getAttribLocation(program, 'position');
      var buffer = gl.createBuffer();
      var vertices = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
      var texture = gl.createTexture();

      gl.uniform1i(samplerLocation, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);

      function renderFrame(element) {
        canvas.width = element.offsetWidth;
        canvas.height = element.offsetHeight;
        section.style.width = element.offsetWidth + 'px';
        section.style.height = element.offsetHeight + 'px';
        
        gl.uniform1f(widthLocation, canvas.width);
        gl.uniform1f(heightLocation, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      if (!useVideo) {
        image.style.display = '';
        renderFrame(image);
      } else {
        video.style.display = '';

        window.requestAnimationFrame(function loop() {
          renderFrame(video);
          window.requestAnimationFrame(loop);
        });
      }
    }  
  });
});
