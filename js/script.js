// Simulador de Física para UI - Ragdoll Physics
// © 2025 João Lucas de Oliveira
// GitHub: https://github.com/joaodd2z
// Email: jl.lucas.oliveira@hotmail.com

// Aliases do Matter.js
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Constraint, Body, Events, Vector } = Matter;

class PhysicsSimulator {
    constructor() {
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.mouse = null;
        this.mouseConstraint = null;
        this.world = null;
        this.canvas = null;
        this.objectCount = 0;
        this.gravityEnabled = true;
        this.ragdolls = [];
        this.sticks = [];
        this.mousePosition = { x: 0, y: 0 };
        this.ragdollAI = new Map(); // Sistema de IA para ragdolls
        this.damageSystem = new Map(); // Sistema de dano
        this.interactionSystem = new Map(); // Sistema de interações
        this.combatSystem = null;
        this.postureSystem = new Map();
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        // Criar engine
        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // Configurar canvas
        this.canvas = document.getElementById('physicsCanvas');
        const worldContainer = document.getElementById('world');
        const rect = worldContainer.getBoundingClientRect();
        
        // Criar renderer
        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: rect.width - 6, // Subtraindo a borda
                height: rect.height - 6,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: false,
                showVelocity: false,
                showDebug: false,
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        // Criar paredes invisíveis
        this.createWalls();
        
        // Configurar mouse
        this.setupMouse();
        
        // Iniciar simulação
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
        
        // Iniciar loop de atualização personalizado
        this.startUpdateLoop();
        
        // Configurar eventos
        this.setupPhysicsEvents();
        
        console.log('🎯 Simulador de Física inicializado!');
        this.initializeCombatSystem();
        
        // Configurar controles de demonstração
        this.setupDemoControls();
        
        console.log('🎮 Controles: ← → (andar), ↑ (pular), Shift (correr)');
        console.log('🥊 Sistema de combate e postura ativado!');
        console.log('🤖 Ragdolls Ativos: G (criar), D (debug), I (estatísticas)');
        console.log('⚖️ Sistema de equilíbrio procedural ativado!');
    }

    createWalls() {
        const width = this.render.options.width;
        const height = this.render.options.height;
        const wallThickness = 50;
        
        const walls = [
            // Chão
            Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { 
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }),
            // Teto
            Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { 
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }),
            // Parede esquerda
            Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { 
                isStatic: true,
                render: { fillStyle: 'transparent' }
            }),
            // Parede direita
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { 
                isStatic: true,
                render: { fillStyle: 'transparent' }
            })
        ];
        
        Composite.add(this.world, walls);
    }

    setupMouse() {
        this.mouse = Mouse.create(this.render.canvas);
        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: this.mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
        
        Composite.add(this.world, this.mouseConstraint);
        
        // Manter o mouse sincronizado com o canvas
        this.render.mouse = this.mouse;
        
        // Configurar eventos do mouse
        Events.on(this.mouseConstraint, 'mousedown', (event) => {
            console.log('Mouse clicado em:', event.mouse.position);
        });
        
        Events.on(this.mouseConstraint, 'mouseup', (event) => {
            console.log('Mouse solto');
        });
        
        // Prevenir scroll no canvas
        this.render.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
        });
        
        // Configurar pixel ratio para telas de alta resolução
        this.mouse.pixelRatio = window.devicePixelRatio || 1;
    }

    setupPhysicsEvents() {
        // Evento principal de atualização
        Events.on(this.engine, 'beforeUpdate', () => {
            this.updateMousePosition();
            this.updateRagdollAI();
            this.updateRagdollInteractions();
            this.preventSpinning();
            this.maintainRagdollPosture();
            this.updateCombatSystem();
        });
        
        // Evento para detectar colisões e danos
        Events.on(this.engine, 'collisionStart', (event) => {
            this.handleCollisions(event.pairs);
        });
        
        // Evento para contar objetos
        Events.on(this.engine, 'afterUpdate', () => {
            this.updateObjectCount();
        });
    }

    updateMousePosition() {
        if (this.mouse && this.mouse.position) {
            this.mousePosition = {
                x: this.mouse.position.x,
                y: this.mouse.position.y
            };
        }
    }

    updateRagdollAI() {
        this.ragdolls.forEach((ragdoll, index) => {
            if (!ragdoll || !ragdoll.head) return;
            
            const ai = this.ragdollAI.get(ragdoll) || this.initializeRagdollAI(ragdoll);
            const head = ragdoll.head;
            const mouseDistance = this.getDistance(head.position, this.mousePosition);
            
            // Comportamento de fuga do mouse
            if (mouseDistance < 200) {
                this.makeRagdollFlee(ragdoll, ai);
            }
            
            // Parkour inteligente - tentar pular obstáculos
            this.performParkour(ragdoll, ai);
            
            // Atualizar estado emocional
            this.updateRagdollEmotion(ragdoll, ai);
            
            // Aplicar comportamentos baseados no estado
            this.applyRagdollBehavior(ragdoll, ai);
        });
    }

    initializeRagdollAI(ragdoll) {
        const ai = {
            fear: 0,
            energy: 100,
            health: 100,
            personality: Math.random(), // 0 = covarde, 1 = corajoso
            lastJump: 0,
            isInjured: false,
            target: null,
            state: 'idle', // idle, fleeing, fighting, injured, parkour
            color: ragdoll.head.render.fillStyle
        };
        this.ragdollAI.set(ragdoll, ai);
        return ai;
    }

    makeRagdollFlee(ragdoll, ai) {
        const head = ragdoll.head;
        const torso = ragdoll.torso;
        const mouseDistance = this.getDistance(head.position, this.mousePosition);
        
        // Calcular direção de fuga
        const fleeDirection = {
            x: head.position.x - this.mousePosition.x,
            y: head.position.y - this.mousePosition.y
        };
        
        // Normalizar
        const magnitude = Math.sqrt(fleeDirection.x * fleeDirection.x + fleeDirection.y * fleeDirection.y);
        if (magnitude > 0) {
            fleeDirection.x /= magnitude;
            fleeDirection.y /= magnitude;
        }
        
        // Aplicar força de fuga com base na personalidade
        const fleeForce = (1 - ai.personality) * 0.002 + 0.001;
        const panicMultiplier = mouseDistance < 100 ? 2 : 1;
        
        Body.applyForce(torso, torso.position, {
            x: fleeDirection.x * fleeForce * panicMultiplier,
            y: fleeDirection.y * fleeForce * panicMultiplier * 0.5
        });
        
        ai.fear = Math.min(100, ai.fear + 2);
        ai.state = 'fleeing';
    }

    performParkour(ragdoll, ai) {
        const now = Date.now();
        if (now - ai.lastJump < 1000) return; // Cooldown de pulo
        
        const head = ragdoll.head;
        const torso = ragdoll.torso;
        
        // Detectar obstáculos próximos
        const obstacles = this.detectObstacles(head.position, 80);
        
        if (obstacles.length > 0 && ai.energy > 20) {
            // Tentar pular o obstáculo
            const jumpForce = 0.008 + (ai.personality * 0.004);
            Body.applyForce(torso, torso.position, {
                x: 0,
                y: -jumpForce
            });
            
            // Aplicar força horizontal para superar o obstáculo
            const obstacle = obstacles[0];
            const direction = head.position.x < obstacle.position.x ? 1 : -1;
            Body.applyForce(torso, torso.position, {
                x: direction * 0.003,
                y: 0
            });
            
            ai.lastJump = now;
            ai.energy -= 20;
            ai.state = 'parkour';
        }
    }

    detectObstacles(position, radius) {
        const allBodies = Composite.allBodies(this.world);
        return allBodies.filter(body => {
            if (body.isStatic) return false;
            const distance = this.getDistance(position, body.position);
            return distance < radius && distance > 10;
        });
    }

    updateRagdollInteractions() {
        for (let i = 0; i < this.ragdolls.length; i++) {
            for (let j = i + 1; j < this.ragdolls.length; j++) {
                const ragdoll1 = this.ragdolls[i];
                const ragdoll2 = this.ragdolls[j];
                
                if (!ragdoll1 || !ragdoll2) continue;
                
                const ai1 = this.ragdollAI.get(ragdoll1);
                const ai2 = this.ragdollAI.get(ragdoll2);
                
                if (!ai1 || !ai2) continue;
                
                const distance = this.getDistance(ragdoll1.head.position, ragdoll2.head.position);
                
                // Interação próxima
                if (distance < 100) {
                    this.handleRagdollInteraction(ragdoll1, ragdoll2, ai1, ai2);
                }
            }
        }
    }

    handleRagdollInteraction(ragdoll1, ragdoll2, ai1, ai2) {
        const compatibility = Math.abs(ai1.personality - ai2.personality);
        
        if (compatibility < 0.3) {
            // Ragdolls compatíveis - cooperação
            this.makeRagdollsCooperate(ragdoll1, ragdoll2, ai1, ai2);
        } else if (compatibility > 0.7) {
            // Ragdolls incompatíveis - conflito
            this.makeRagdollsFight(ragdoll1, ragdoll2, ai1, ai2);
        } else {
            // Interação neutra - curiosidade
            this.makeRagdollsCurious(ragdoll1, ragdoll2, ai1, ai2);
        }
    }

    makeRagdollsCooperate(ragdoll1, ragdoll2, ai1, ai2) {
        // Ragdolls se ajudam mutuamente
        const center = {
            x: (ragdoll1.head.position.x + ragdoll2.head.position.x) / 2,
            y: (ragdoll1.head.position.y + ragdoll2.head.position.y) / 2
        };
        
        // Aplicar força suave em direção um ao outro
        const force1 = {
            x: (ragdoll2.head.position.x - ragdoll1.head.position.x) * 0.0001,
            y: (ragdoll2.head.position.y - ragdoll1.head.position.y) * 0.0001
        };
        
        const force2 = {
            x: (ragdoll1.head.position.x - ragdoll2.head.position.x) * 0.0001,
            y: (ragdoll1.head.position.y - ragdoll2.head.position.y) * 0.0001
        };
        
        Body.applyForce(ragdoll1.torso, ragdoll1.torso.position, force1);
        Body.applyForce(ragdoll2.torso, ragdoll2.torso.position, force2);
        
        ai1.state = 'cooperating';
        ai2.state = 'cooperating';
        
        // Cura mútua se feridos
        if (ai1.isInjured) ai1.health = Math.min(100, ai1.health + 0.5);
        if (ai2.isInjured) ai2.health = Math.min(100, ai2.health + 0.5);
    }

    makeRagdollsFight(ragdoll1, ragdoll2, ai1, ai2) {
        // Ragdolls brigam
        const force1 = {
            x: (ragdoll2.head.position.x - ragdoll1.head.position.x) * 0.003,
            y: (ragdoll2.head.position.y - ragdoll1.head.position.y) * 0.001
        };
        
        const force2 = {
            x: (ragdoll1.head.position.x - ragdoll2.head.position.x) * 0.003,
            y: (ragdoll1.head.position.y - ragdoll2.head.position.y) * 0.001
        };
        
        Body.applyForce(ragdoll1.torso, ragdoll1.torso.position, force1);
        Body.applyForce(ragdoll2.torso, ragdoll2.torso.position, force2);
        
        ai1.state = 'fighting';
        ai2.state = 'fighting';
        ai1.energy -= 1;
        ai2.energy -= 1;
    }

    makeRagdollsCurious(ragdoll1, ragdoll2, ai1, ai2) {
        // Ragdolls se observam com curiosidade
        ai1.state = 'curious';
        ai2.state = 'curious';
        
        // Movimento sutil de aproximação
        const force = 0.0002;
        const direction1 = {
            x: (ragdoll2.head.position.x - ragdoll1.head.position.x) * force,
            y: 0
        };
        
        const direction2 = {
            x: (ragdoll1.head.position.x - ragdoll2.head.position.x) * force,
            y: 0
        };
        
        Body.applyForce(ragdoll1.torso, ragdoll1.torso.position, direction1);
        Body.applyForce(ragdoll2.torso, ragdoll2.torso.position, direction2);
    }

    preventSpinning() {
        if (!this.gravityEnabled) {
            // Quando a gravidade está desativada, prevenir rotação excessiva
            this.ragdolls.forEach(ragdoll => {
                if (ragdoll && ragdoll.head) {
                    [ragdoll.head, ragdoll.torso, ragdoll.leftArm, ragdoll.rightArm, ragdoll.leftLeg, ragdoll.rightLeg].forEach(part => {
                        if (part) {
                            // Reduzir velocidade angular drasticamente
                            Body.setAngularVelocity(part, part.angularVelocity * 0.95);
                            
                            // Aplicar força de estabilização
                            if (Math.abs(part.angularVelocity) > 0.1) {
                                Body.setAngularVelocity(part, part.angularVelocity * 0.8);
                            }
                        }
                    });
                }
            });
            
            // Aplicar também a outros objetos
            const allBodies = Composite.allBodies(this.world);
            allBodies.forEach(body => {
                if (!body.isStatic && Math.abs(body.angularVelocity) > 0.2) {
                    Body.setAngularVelocity(body, body.angularVelocity * 0.9);
                }
            });
        }
    }

    handleCollisions(pairs) {
        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            
            // Verificar se algum dos corpos é parte de um ragdoll
            const ragdollA = this.findRagdollByBody(bodyA);
            const ragdollB = this.findRagdollByBody(bodyB);
            
            // Calcular força do impacto
            const velocityA = Math.sqrt(bodyA.velocity.x ** 2 + bodyA.velocity.y ** 2);
            const velocityB = Math.sqrt(bodyB.velocity.x ** 2 + bodyB.velocity.y ** 2);
            const impactForce = Math.max(velocityA, velocityB);
            
            // SISTEMA DE COMBATE: Detecção de socos
            if (ragdollA && ragdollB && ragdollA !== ragdollB) {
                this.handleCombatCollision(bodyA, bodyB, ragdollA, ragdollB, impactForce);
            }
            
            // Verificar colisão com paredes (dano por impacto)
            if (bodyA.isStatic || bodyB.isStatic) {
                const ragdoll = ragdollA || ragdollB;
                if (ragdoll && impactForce > 5) {
                    this.damageRagdoll(ragdoll, impactForce);
                }
            }
            
            // Colisão entre ragdolls (dano geral)
            if (ragdollA && ragdollB && impactForce > 3) {
                this.damageRagdoll(ragdollA, impactForce * 0.5);
                this.damageRagdoll(ragdollB, impactForce * 0.5);
            }
        });
    }
    
    // Novo método para detectar combate específico
    handleCombatCollision(bodyA, bodyB, ragdollA, ragdollB, impactForce) {
        // Verificar se é um soco: punho de um ragdoll atacante vs torso/cabeça do oponente
        const isAttackA = ragdollA.state === 'ATTACKING' && ragdollA.isAttacking;
        const isAttackB = ragdollB.state === 'ATTACKING' && ragdollB.isAttacking;
        
        // Verificar se bodyA é punho de ragdollA atacando bodyB (torso/cabeça) de ragdollB
        if (isAttackA && this.isPunchHit(bodyA, bodyB, ragdollA, ragdollB, impactForce)) {
            this.processPunchDamage(ragdollA, ragdollB, impactForce, 'rightArm');
        }
        
        // Verificar se bodyB é punho de ragdollB atacando bodyA (torso/cabeça) de ragdollA
        if (isAttackB && this.isPunchHit(bodyB, bodyA, ragdollB, ragdollA, impactForce)) {
            this.processPunchDamage(ragdollB, ragdollA, impactForce, 'rightArm');
        }
    }
    
    // Verificar se é um soco válido
    isPunchHit(punchBody, targetBody, attacker, target, impactForce) {
        // Verificar se o corpo que ataca é o braço direito do atacante
        const isRightArm = punchBody === attacker.rightArm;
        
        // Verificar se o alvo é torso ou cabeça
        const isValidTarget = targetBody === target.torso || targetBody === target.head;
        
        // Verificar se a velocidade é suficiente para causar dano
        const hasEnoughForce = impactForce > 2;
        
        return isRightArm && isValidTarget && hasEnoughForce;
    }
    
    // Processar dano do soco
    processPunchDamage(attacker, target, impactForce, limbUsed) {
        const damage = Math.min(15, impactForce * 3); // Máximo 15 de dano
        
        console.log(`🥊 SOCO! Ragdoll ${attacker.id} acertou Ragdoll ${target.id} com força ${impactForce.toFixed(2)} causando ${damage.toFixed(1)} de dano`);
        
        // Aplicar dano ao alvo
        target.takeDamage(damage, attacker);
        
        // Feedback visual: fazer o alvo recuar
        const knockbackForce = impactForce * 0.002;
        const direction = {
            x: target.torso.position.x - attacker.torso.position.x,
            y: target.torso.position.y - attacker.torso.position.y
        };
        
        // Normalizar direção
        const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (magnitude > 0) {
            direction.x /= magnitude;
            direction.y /= magnitude;
        }
        
        // Aplicar força de recuo
        target.applyForceToLimb('torso', {
            x: direction.x * knockbackForce,
            y: direction.y * knockbackForce * 0.5
        });
    }

    findRagdollByBody(body) {
        return this.ragdolls.find(ragdoll => {
            return ragdoll && (
                ragdoll.head === body ||
                ragdoll.torso === body ||
                ragdoll.leftArm === body ||
                ragdoll.rightArm === body ||
                ragdoll.leftLeg === body ||
                ragdoll.rightLeg === body
            );
        });
    }

    damageRagdoll(ragdoll, force) {
        const ai = this.ragdollAI.get(ragdoll);
        if (!ai) return;
        
        const damage = Math.min(force * 2, 20);
        ai.health -= damage;
        ai.fear += damage;
        
        if (ai.health < 50) {
            ai.isInjured = true;
            ai.state = 'injured';
            
            // Mudar cor para indicar ferimento
            ragdoll.head.render.fillStyle = '#ff6b6b';
            ragdoll.torso.render.fillStyle = '#ff8e8e';
        }
        
        if (ai.health <= 0) {
            // Ragdoll "morto" - tornar mais escuro
            [ragdoll.head, ragdoll.torso, ragdoll.leftArm, ragdoll.rightArm, ragdoll.leftLeg, ragdoll.rightLeg].forEach(part => {
                if (part) {
                    part.render.fillStyle = '#333333';
                }
            });
            ai.state = 'dead';
        }
    }

    updateRagdollEmotion(ragdoll, ai) {
        // Recuperação gradual
        if (ai.fear > 0) ai.fear -= 0.1;
        if (ai.energy < 100) ai.energy += 0.2;
        if (ai.isInjured && ai.health < 100) ai.health += 0.1;
        
        // Remover estado de ferimento se curado
        if (ai.isInjured && ai.health > 80) {
            ai.isInjured = false;
            ragdoll.head.render.fillStyle = ai.color;
            ragdoll.torso.render.fillStyle = '#4a90e2';
        }
        
        // Resetar estado se não há ação específica
        if (ai.state !== 'dead' && ai.fear < 10 && ai.energy > 50) {
            ai.state = 'idle';
        }
    }

    applyRagdollBehavior(ragdoll, ai) {
        if (ai.state === 'dead') return;
        
        const torso = ragdoll.torso;
        
        // Comportamento baseado no estado
        switch (ai.state) {
            case 'injured':
                // Movimento mais lento e errático
                if (Math.random() < 0.1) {
                    Body.applyForce(torso, torso.position, {
                        x: (Math.random() - 0.5) * 0.001,
                        y: 0
                    });
                }
                break;
                
            case 'idle':
                // Movimento aleatório ocasional
                if (Math.random() < 0.02) {
                    Body.applyForce(torso, torso.position, {
                        x: (Math.random() - 0.5) * 0.002,
                        y: 0
                    });
                }
                break;
        }
    }

    getDistance(pos1, pos2) {
        return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
    }
    
    // Sistema de Combate e Postura
    initializeCombatSystem() {
        // Carregar sistema de combate se disponível
        if (typeof CombatSystem !== 'undefined') {
            this.combatSystem = new CombatSystem(this);
            console.log('🥊 Sistema de Combate Carregado!');
        }
    }
    
    updateCombatSystem() {
        if (this.combatSystem) {
            // Atualizar regeneração de stamina e vida
            this.combatSystem.combatStates.forEach((state, ragdoll) => {
                if (state.stamina < 100) {
                    state.stamina = Math.min(100, state.stamina + 0.2);
                }
                if (state.health > 0 && state.health < 100) {
                    state.health = Math.min(100, state.health + 0.05);
                }
            });
        }
    }
    
    maintainRagdollPosture() {
        this.ragdolls.forEach(ragdoll => {
            if (!ragdoll) return;
            
            const ai = this.ragdollAI.get(ragdoll);
            if (!ai || ai.state === 'dead') return;
            
            this.keepRagdollUpright(ragdoll);
            this.stabilizeRagdollMovement(ragdoll);
        });
    }
    
    keepRagdollUpright(ragdoll) {
        const head = ragdoll.head;
        const torso = ragdoll.torso;
        const leftLeg = ragdoll.leftLeg;
        const rightLeg = ragdoll.rightLeg;
        
        if (!head || !torso || !leftLeg || !rightLeg) return;
        
        // Verificar se o ragdoll está de cabeça para baixo
        const headBelowTorso = head.position.y > torso.position.y;
        const torsoAngle = torso.angle;
        
        // Força para manter em pé
        if (Math.abs(torsoAngle) > 0.3 || headBelowTorso) {
            // Aplicar força corretiva no torso
            const uprightForce = -torsoAngle * 0.001;
            Body.applyForce(torso, torso.position, {
                x: uprightForce,
                y: headBelowTorso ? -0.002 : 0
            });
            
            // Estabilizar cabeça
            if (headBelowTorso) {
                Body.applyForce(head, head.position, {
                    x: 0,
                    y: -0.001
                });
            }
        }
        
        // Manter pernas no chão
        const groundLevel = this.render.options.height - 50;
        
        if (leftLeg.position.y < groundLevel - 100) {
            Body.applyForce(leftLeg, leftLeg.position, {
                x: 0,
                y: 0.001
            });
        }
        
        if (rightLeg.position.y < groundLevel - 100) {
            Body.applyForce(rightLeg, rightLeg.position, {
                x: 0,
                y: 0.001
            });
        }
        
        // Balanceamento automático
        this.autoBalance(ragdoll);
    }
    
    autoBalance(ragdoll) {
        const torso = ragdoll.torso;
        const leftLeg = ragdoll.leftLeg;
        const rightLeg = ragdoll.rightLeg;
        
        if (!torso || !leftLeg || !rightLeg) return;
        
        // Calcular centro de massa
        const centerX = (leftLeg.position.x + rightLeg.position.x) / 2;
        const torsoX = torso.position.x;
        
        // Aplicar força de balanceamento
        const imbalance = torsoX - centerX;
        if (Math.abs(imbalance) > 10) {
            const balanceForce = -imbalance * 0.0001;
            Body.applyForce(torso, torso.position, {
                x: balanceForce,
                y: 0
            });
            
            // Ajustar posição das pernas
            const legAdjustment = imbalance * 0.00005;
            Body.applyForce(leftLeg, leftLeg.position, {
                x: -legAdjustment,
                y: 0
            });
            Body.applyForce(rightLeg, rightLeg.position, {
                x: legAdjustment,
                y: 0
            });
        }
    }
    
    stabilizeRagdollMovement(ragdoll) {
        const ai = this.ragdollAI.get(ragdoll);
        if (!ai) return;
        
        // Reduzir velocidades excessivas
        [ragdoll.head, ragdoll.torso, ragdoll.leftArm, ragdoll.rightArm, ragdoll.leftLeg, ragdoll.rightLeg].forEach(part => {
            if (!part) return;
            
            // Limitar velocidade máxima
            const maxVelocity = ai.state === 'fleeing' ? 8 : 5;
            const velocity = Math.sqrt(part.velocity.x ** 2 + part.velocity.y ** 2);
            
            if (velocity > maxVelocity) {
                const scale = maxVelocity / velocity;
                Body.setVelocity(part, {
                    x: part.velocity.x * scale,
                    y: part.velocity.y * scale
                });
            }
            
            // Reduzir rotação excessiva
            if (Math.abs(part.angularVelocity) > 0.3) {
                Body.setAngularVelocity(part, part.angularVelocity * 0.8);
            }
        });
    }
    
    makeRagdollWalk(ragdoll, direction) {
        const torso = ragdoll.torso;
        const leftLeg = ragdoll.leftLeg;
        const rightLeg = ragdoll.rightLeg;
        
        if (!torso || !leftLeg || !rightLeg) return;
        
        const walkForce = 0.002;
        const directionMultiplier = direction === 'left' ? -1 : 1;
        
        // Aplicar força de caminhada
        Body.applyForce(torso, torso.position, {
            x: walkForce * directionMultiplier,
            y: 0
        });
        
        // Animação de caminhada alternada
        const time = Date.now();
        const leftLegPhase = Math.sin(time * 0.01);
        const rightLegPhase = Math.sin(time * 0.01 + Math.PI);
        
        Body.applyForce(leftLeg, leftLeg.position, {
            x: leftLegPhase * 0.0005 * directionMultiplier,
            y: Math.abs(leftLegPhase) * -0.0002
        });
        
        Body.applyForce(rightLeg, rightLeg.position, {
            x: rightLegPhase * 0.0005 * directionMultiplier,
            y: Math.abs(rightLegPhase) * -0.0002
        });
    }
    
    makeRagdollRun(ragdoll, direction) {
        const torso = ragdoll.torso;
        const leftLeg = ragdoll.leftLeg;
        const rightLeg = ragdoll.rightLeg;
        const leftArm = ragdoll.leftArm;
        const rightArm = ragdoll.rightArm;
        
        if (!torso || !leftLeg || !rightLeg) return;
        
        const runForce = 0.004;
        const directionMultiplier = direction === 'left' ? -1 : 1;
        
        // Aplicar força de corrida
        Body.applyForce(torso, torso.position, {
            x: runForce * directionMultiplier,
            y: 0
        });
        
        // Animação de corrida mais intensa
        const time = Date.now();
        const leftLegPhase = Math.sin(time * 0.02);
        const rightLegPhase = Math.sin(time * 0.02 + Math.PI);
        
        // Movimento das pernas
        Body.applyForce(leftLeg, leftLeg.position, {
            x: leftLegPhase * 0.001 * directionMultiplier,
            y: Math.abs(leftLegPhase) * -0.0005
        });
        
        Body.applyForce(rightLeg, rightLeg.position, {
            x: rightLegPhase * 0.001 * directionMultiplier,
            y: Math.abs(rightLegPhase) * -0.0005
        });
        
        // Movimento dos braços
        if (leftArm && rightArm) {
            Body.applyForce(leftArm, leftArm.position, {
                x: -leftLegPhase * 0.0003 * directionMultiplier,
                y: 0
            });
            
            Body.applyForce(rightArm, rightArm.position, {
                x: -rightLegPhase * 0.0003 * directionMultiplier,
                y: 0
            });
        }
    }
    
    makeRagdollJump(ragdoll) {
        const torso = ragdoll.torso;
        const leftLeg = ragdoll.leftLeg;
        const rightLeg = ragdoll.rightLeg;
        
        if (!torso || !leftLeg || !rightLeg) return;
        
        const ai = this.ragdollAI.get(ragdoll);
        if (!ai || ai.energy < 20) return;
        
        const jumpForce = 0.015;
        
        // Aplicar força de pulo
        Body.applyForce(torso, torso.position, {
            x: 0,
            y: -jumpForce
        });
        
        Body.applyForce(leftLeg, leftLeg.position, {
            x: 0,
            y: -jumpForce * 0.5
        });
        
        Body.applyForce(rightLeg, rightLeg.position, {
            x: 0,
            y: -jumpForce * 0.5
        });
        
        ai.energy -= 20;
        ai.state = 'jumping';
        
        console.log('🦘 Ragdoll pulou!');
    }
    
    // Controles de demonstração
    setupDemoControls() {
        document.addEventListener('keydown', (event) => {
            const ragdoll = this.ragdolls[0]; // Primeiro ragdoll
            if (!ragdoll) return;
            
            switch(event.key.toLowerCase()) {
                case 'arrowleft':
                    this.makeRagdollWalk(ragdoll, 'left');
                    break;
                case 'arrowright':
                    this.makeRagdollWalk(ragdoll, 'right');
                    break;
                case 'arrowup':
                    this.makeRagdollJump(ragdoll);
                    break;
                case 'shift':
                    if (event.code === 'ShiftLeft') {
                        this.makeRagdollRun(ragdoll, 'left');
                    } else {
                        this.makeRagdollRun(ragdoll, 'right');
                    }
                    break;
            }
        });
    }

    createCard() {
        const width = this.render.options.width;
        const x = Math.random() * (width - 100) + 50;
        const y = 50;
        
        const card = Bodies.rectangle(x, y, 80, 120, {
            render: {
                fillStyle: `hsl(${Math.random() * 360}, 70%, 60%)`,
                strokeStyle: '#fff',
                lineWidth: 2
            },
            restitution: 0.3,
            friction: 0.7,
            density: 0.001
        });
        
        Composite.add(this.world, card);
        this.objectCount++;
        console.log('📱 Card criado!');
    }

    createBall() {
        const width = this.render.options.width;
        const x = Math.random() * (width - 60) + 30;
        const y = 50;
        
        const ball = Bodies.circle(x, y, 25, {
            render: {
                fillStyle: `hsl(${Math.random() * 360}, 80%, 65%)`,
                strokeStyle: '#fff',
                lineWidth: 2
            },
            restitution: 0.8,
            friction: 0.3,
            density: 0.001
        });
        
        Composite.add(this.world, ball);
        this.objectCount++;
        console.log('⚪ Bolinha criada!');
    }

    createRagdoll() {
        const width = this.render.options.width;
        const x = Math.random() * (width - 200) + 100;
        const y = 100;
        
        try {
            // Criar novo ragdoll ativo usando a classe Ragdoll
            const ragdoll = new Ragdoll(x, y, this.world, this.render);
            this.ragdolls.push(ragdoll);
            
            this.objectCount += 6; // 6 partes do corpo
            this.updateObjectCount();
            console.log(`🤖 Ragdoll Ativo #${this.ragdolls.length} criado! Sistema de equilíbrio ativado.`);
        } catch (error) {
            console.error('Erro ao criar ragdoll:', error);
            // Fallback: criar ragdoll simples
            this.createSimpleRagdoll(x, y);
        }
    }
    
    createSimpleRagdoll(x, y) {
        // Criar partes do corpo
        const head = Bodies.circle(x, y, 20, {
            render: { fillStyle: '#ffdbac', strokeStyle: '#333', lineWidth: 2 },
            density: 0.001,
            friction: 0.8,
            label: 'ragdoll_head'
        });
        
        const torso = Bodies.rectangle(x, y + 50, 30, 60, {
            render: { fillStyle: '#4a90e2', strokeStyle: '#333', lineWidth: 2 },
            density: 0.002,
            friction: 0.8,
            label: 'ragdoll_torso'
        });
        
        const leftArm = Bodies.rectangle(x - 35, y + 30, 12, 40, {
            render: { fillStyle: '#ffdbac', strokeStyle: '#333', lineWidth: 2 },
            density: 0.001,
            friction: 0.8,
            label: 'ragdoll_leftArm'
        });
        
        const rightArm = Bodies.rectangle(x + 35, y + 30, 12, 40, {
            render: { fillStyle: '#ffdbac', strokeStyle: '#333', lineWidth: 2 },
            density: 0.001,
            friction: 0.8,
            label: 'ragdoll_rightArm'
        });
        
        const leftLeg = Bodies.rectangle(x - 15, y + 100, 15, 50, {
            render: { fillStyle: '#2c3e50', strokeStyle: '#333', lineWidth: 2 },
            density: 0.001,
            friction: 0.9,
            label: 'ragdoll_leftLeg'
        });
        
        const rightLeg = Bodies.rectangle(x + 15, y + 100, 15, 50, {
            render: { fillStyle: '#2c3e50', strokeStyle: '#333', lineWidth: 2 },
            density: 0.001,
            friction: 0.9,
            label: 'ragdoll_rightLeg'
        });
        
        // Criar articulações
        const neckConstraint = Constraint.create({
            bodyA: head,
            bodyB: torso,
            length: 10,
            stiffness: 0.8
        });
        
        const leftShoulderConstraint = Constraint.create({
            bodyA: torso,
            bodyB: leftArm,
            pointA: { x: -15, y: -20 },
            pointB: { x: 0, y: -20 },
            length: 5,
            stiffness: 0.7
        });
        
        const rightShoulderConstraint = Constraint.create({
            bodyA: torso,
            bodyB: rightArm,
            pointA: { x: 15, y: -20 },
            pointB: { x: 0, y: -20 },
            length: 5,
            stiffness: 0.7
        });
        
        const leftHipConstraint = Constraint.create({
            bodyA: torso,
            bodyB: leftLeg,
            pointA: { x: -10, y: 30 },
            pointB: { x: 0, y: -25 },
            length: 5,
            stiffness: 0.8
        });
        
        const rightHipConstraint = Constraint.create({
            bodyA: torso,
            bodyB: rightLeg,
            pointA: { x: 10, y: 30 },
            pointB: { x: 0, y: -25 },
            length: 5,
            stiffness: 0.8
        });
        
        // Adicionar tudo ao mundo
        const ragdollParts = [head, torso, leftArm, rightArm, leftLeg, rightLeg];
        const ragdollConstraints = [neckConstraint, leftShoulderConstraint, rightShoulderConstraint, leftHipConstraint, rightHipConstraint];
        
        Composite.add(this.world, [...ragdollParts, ...ragdollConstraints]);
        
        // Armazenar ragdoll simples
        const ragdoll = {
            head, torso, leftArm, rightArm, leftLeg, rightLeg,
            constraints: ragdollConstraints,
            id: Math.random().toString(36).substr(2, 9),
            isSimple: true
        };
        
        this.ragdolls.push(ragdoll);
        this.objectCount += 6;
        this.updateObjectCount();
        
        console.log(`🤸 Ragdoll Simples #${this.ragdolls.length} criado!`);
    }

    createStick() {
        const width = this.render.options.width;
        const x = Math.random() * (width - 100) + 50;
        const y = 50;
        
        const stick = Bodies.rectangle(x, y, 100, 8, {
            render: {
                fillStyle: '#8B4513',
                strokeStyle: '#654321',
                lineWidth: 1
            },
            restitution: 0.4,
            friction: 0.8,
            density: 0.0008
        });
        
        Composite.add(this.world, stick);
        this.sticks.push(stick);
        this.objectCount++;
        console.log('🏒 Stick criado!');
    }
    
    /**
     * Cria um novo lutador com IA avançada
     */
    createFighter() {
        try {
            // Posição aleatória na arena
            const x = Math.random() * (this.render.options.width - 200) + 100;
            const y = 100;
            
            // Criar ragdoll com sistema de combate
            const fighter = new Ragdoll(x, y, this.world, this.render);
            
            // Configurar estado inicial de combate
            fighter.state = 'BALANCING';
            fighter.health = 100;
            fighter.stamina = 100;
            fighter.isActive = true;
            
            // Adicionar à lista de ragdolls
            this.ragdolls.push(fighter);
            
            console.log(`🥊 Novo lutador criado: ${fighter.id}`);
            console.log(`   Personalidade: Agressão ${fighter.personality.aggression.toFixed(1)}, Resistência ${fighter.personality.endurance.toFixed(1)}, Reflexos ${fighter.personality.reflexes.toFixed(1)}`);
            console.log(`   Aparência: ${fighter.appearance.skinTone}, ${fighter.appearance.shirtColor}, ${fighter.appearance.pantColor}`);
            
            this.updateObjectCount();
            
            return fighter;
            
        } catch (error) {
            console.error('❌ Erro ao criar lutador:', error);
            // Fallback para método simples se houver erro
            const x = Math.random() * (this.render.options.width - 200) + 100;
            const y = 100;
            return this.createSimpleRagdoll(x, y);
        }
    }
    
    /**
     * Inicia o modo de combate entre os ragdolls
     */
    startCombatMode() {
        const activeFighters = this.ragdolls.filter(r => r && r.isActive && r.health > 0);
        
        if (activeFighters.length < 2) {
            alert('⚠️ É necessário pelo menos 2 lutadores ativos para iniciar o combate!');
            console.log('❌ Combate não pode ser iniciado - lutadores insuficientes');
            return;
        }
        
        console.log('🥊 INICIANDO MODO DE COMBATE!');
        console.log(`   Lutadores participantes: ${activeFighters.length}`);
        
        // Configurar todos os lutadores para combate
        activeFighters.forEach((fighter, index) => {
            // Resetar estado de combate
            fighter.state = 'BALANCING';
            fighter.health = 100;
            fighter.stamina = 100;
            fighter.isActive = true;
            
            // Resetar sistema de combate se disponível
            if (fighter.combat) {
                fighter.combat.target = null;
                fighter.combat.attackCooldown = 0;
                fighter.combat.staggerTime = 0;
                fighter.combat.isAttacking = false;
            }
            
            // Posicionar lutadores em lados opostos da arena
            const spacing = this.render.options.width / (activeFighters.length + 1);
            const newX = spacing * (index + 1);
            const newY = this.render.options.height - 150;
            
            // Mover lutador para nova posição
            Body.setPosition(fighter.torso, { x: newX, y: newY });
            
            console.log(`   ${fighter.id}: Posição (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
        });
        
        // Ativar modo debug para ver informações dos lutadores
        this.debugMode = true;
        
        // Feedback visual
        const message = `🥊 COMBATE INICIADO!\n${activeFighters.length} lutadores na arena\n\nPressione 'D' para alternar modo debug`;
        alert(message);
        
        console.log('✅ Modo de combate ativado com sucesso!');
        console.log('   Pressione "D" para alternar informações de debug');
    }

    clearWorld() {
        // Remover todos os corpos exceto as paredes
        const allBodies = Composite.allBodies(this.world);
        const bodiesToRemove = allBodies.filter(body => !body.isStatic);
        
        Composite.remove(this.world, bodiesToRemove);
        
        // Remover todas as constraints exceto as do mouse
        const allConstraints = Composite.allConstraints(this.world);
        const constraintsToRemove = allConstraints.filter(constraint => constraint !== this.mouseConstraint);
        
        Composite.remove(this.world, constraintsToRemove);
        
        // Limpar arrays
        this.ragdolls = [];
        this.sticks = [];
        this.objectCount = 0;
        
        console.log('🗑️ Mundo limpo!');
    }

    toggleGravity() {
        this.gravityEnabled = !this.gravityEnabled;
        this.engine.world.gravity.y = this.gravityEnabled ? 1 : 0;
        
        const gravityStatus = document.getElementById('gravityStatus');
        gravityStatus.textContent = `Gravidade: ${this.gravityEnabled ? 'ON' : 'OFF'}`;
        
        console.log(`🌍 Gravidade: ${this.gravityEnabled ? 'Ativada' : 'Desativada'}`);
    }

    updateObjectCount() {
        const objectCountElement = document.getElementById('objectCount');
        if (objectCountElement) {
            const currentCount = Composite.allBodies(this.world).filter(body => !body.isStatic).length;
            objectCountElement.textContent = `Objetos: ${currentCount}`;
        }
    }

    setupEventListeners() {
        // Botões de controle
        document.getElementById('addCard').addEventListener('click', () => this.createCard());
        document.getElementById('addBall').addEventListener('click', () => this.createBall());
        document.getElementById('addRagdoll').addEventListener('click', () => this.createRagdoll());
        document.getElementById('addStick').addEventListener('click', () => this.createStick());
        document.getElementById('createFighter').addEventListener('click', () => this.createFighter());
        document.getElementById('startCombat').addEventListener('click', () => this.startCombatMode());
        document.getElementById('clearWorld').addEventListener('click', () => this.clearWorld());
        document.getElementById('toggleGravity').addEventListener('click', () => this.toggleGravity());
        
        // Redimensionamento da janela
        window.addEventListener('resize', () => this.handleResize());
        
        // Teclas de atalho
        document.addEventListener('keydown', (event) => {
            switch(event.key.toLowerCase()) {
                case 'c':
                    this.createCard();
                    break;
                case 'b':
                    this.createBall();
                    break;
                case 'r':
                    this.createRagdoll();
                    break;
                case 's':
                    this.createStick();
                    break;
                case 'f':
                    // Criar lutador
                    this.createFighter();
                    break;
                case 'v':
                    // Iniciar combate
                    this.startCombatMode();
                    break;
                case 'x':
                    this.clearWorld();
                    break;
                case 'g':
                    this.toggleGravity();
                    break;
                case 'd':
                    // Alternar modo debug global
                    window.debugMode = !window.debugMode;
                    console.log(`🔍 Modo debug: ${window.debugMode ? 'ATIVADO' : 'DESATIVADO'}`);
                    if (window.debugMode) {
                        console.log('   Agora você pode ver informações detalhadas dos lutadores!');
                    }
                    break;
                case 'i':
                    // Mostrar estatísticas dos ragdolls
                    const stats = this.getRagdollStats();
                    console.log('📊 Estatísticas dos Ragdolls:', stats);
                    break;
                case 'h':
                    // Mostrar ajuda
                    console.log('🎮 ATALHOS DE TECLADO:');
                    console.log('   C = Criar Card');
                    console.log('   B = Criar Bola');
                    console.log('   R = Criar Ragdoll');
                    console.log('   S = Criar Bastão');
                    console.log('   F = Criar Lutador');
                    console.log('   V = Iniciar Combate');
                    console.log('   X = Limpar Mundo');
                    console.log('   G = Alternar Gravidade');
                    console.log('   D = Modo Debug');
                    console.log('   I = Estatísticas');
                    console.log('   H = Ajuda');
                    break;
            }
        });
        
        console.log('🎮 Event listeners configurados!');
        console.log('⌨️ Atalhos básicos: C=Card, B=Ball, R=Ragdoll, S=Stick, X=Clear, G=Gravity');
        console.log('🥊 Atalhos de combate: F=Criar Lutador, V=Iniciar Combate, D=Debug, H=Ajuda');
        console.log('💡 Pressione H para ver todos os atalhos disponíveis!');
    }

    handleResize() {
        const worldContainer = document.getElementById('world');
        const rect = worldContainer.getBoundingClientRect();
        
        // Atualizar dimensões do render
        this.render.options.width = rect.width - 6;
        this.render.options.height = rect.height - 6;
        this.render.canvas.width = this.render.options.width;
        this.render.canvas.height = this.render.options.height;
        
        // Recriar paredes
        const allBodies = Composite.allBodies(this.world);
        const walls = allBodies.filter(body => body.isStatic);
        Composite.remove(this.world, walls);
        this.createWalls();
        
        console.log('📐 Simulador redimensionado!');
    }
    
    // SISTEMA DE RAGDOLLS ATIVOS
    
    // Iniciar loop de atualização personalizado
    startUpdateLoop() {
        const updateLoop = () => {
            // Atualizar ragdolls ativos (sistema de equilíbrio)
            this.updateActiveRagdolls();
            
            // Renderizar debug dos ragdolls
            this.renderRagdollDebug();
            
            // Continuar o loop
            requestAnimationFrame(updateLoop);
        };
        
        // Iniciar o loop
        requestAnimationFrame(updateLoop);
        console.log('🔄 Loop de atualização de ragdolls ativos iniciado!');
    }
    
    // Atualizar todos os ragdolls ativos
    updateActiveRagdolls() {
        if (!this.ragdolls) return;
        
        // Filtrar ragdolls ativos para passar como parâmetro
        const activeRagdolls = this.ragdolls.filter(ragdoll => ragdoll && ragdoll.isActive);
        
        // Atualizar cada ragdoll passando todos os outros ragdolls ativos
        activeRagdolls.forEach(ragdoll => {
            if (ragdoll && ragdoll.isActive) {
                ragdoll.update(activeRagdolls);
            }
        });
    }
    
    // Renderizar informações de debug dos ragdolls
    renderRagdollDebug() {
        if (!this.ragdolls || this.ragdolls.length === 0) return;
        
        const canvas = this.render.canvas;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        this.ragdolls.forEach(ragdoll => {
            if (ragdoll && ragdoll.renderDebugInfo) {
                ragdoll.renderDebugInfo(ctx);
            }
        });
    }
    
    // Método para alternar debug de todos os ragdolls
    toggleAllRagdollDebug() {
        if (!this.ragdolls) return;
        
        this.ragdolls.forEach(ragdoll => {
            if (ragdoll && ragdoll.toggleDebug) {
                ragdoll.toggleDebug();
            }
        });
        
        console.log('🔍 Debug visual alternado para todos os ragdolls!');
    }
    
    // Método para obter estatísticas dos ragdolls
    getRagdollStats() {
        if (!this.ragdolls || this.ragdolls.length === 0) {
            return { total: 0, active: 0, averageStability: 0, averageEnergy: 0 };
        }
        
        const activeRagdolls = this.ragdolls.filter(r => r && r.isActive);
        const totalStability = activeRagdolls.reduce((sum, r) => sum + (r.stability || 0), 0);
        const totalEnergy = activeRagdolls.reduce((sum, r) => sum + (r.energy || 0), 0);
        
        return {
            total: this.ragdolls.length,
            active: activeRagdolls.length,
            averageStability: activeRagdolls.length > 0 ? (totalStability / activeRagdolls.length).toFixed(2) : 0,
            averageEnergy: activeRagdolls.length > 0 ? (totalEnergy / activeRagdolls.length).toFixed(1) : 0
        };
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Simulador de Física para UI...');
    console.log('👨‍💻 Desenvolvido por João Lucas de Oliveira');
    console.log('🔗 GitHub: https://github.com/joaodd2z');
    
    // Verificar se Matter.js foi carregado
    if (typeof Matter === 'undefined') {
        console.error('❌ Matter.js não foi carregado!');
        alert('Erro: Matter.js não foi carregado. Verifique sua conexão com a internet.');
        return;
    }
    
    // Inicializar simulador
    const simulator = new PhysicsSimulator();
    
    // Adicionar alguns objetos iniciais para demonstração
    setTimeout(() => {
        simulator.createRagdoll();
        simulator.createCard();
        simulator.createBall();
        simulator.createStick();
    }, 1000);
    
    console.log('✅ Simulador inicializado com sucesso!');
});

// Exportar para uso global se necessário
window.PhysicsSimulator = PhysicsSimulator;